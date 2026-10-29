# 12: Content Catalog: Species, Moves, Items, TMs

> **TL;DR:** Treat **Showdown's dex as the canonical catalog** for battle data (species, moves, abilities, items, learnsets, typechart) and key everything by Showdown ID. Keep Mongo `DexEntry` as *enrichment* (sprites, flavor, catch rate, EXP yield, growth rate, which Showdown lacks) and as the store for custom species. Add an **ItemDefinition** layer for overworld behavior (bag pocket, price, field use), since Showdown items only know battle effects. Region-level overlays (pokedex, TM list, item availability, prices) live in region content.

**MVP impact:** High · **Cost to change later:** Medium

## Current shape
- `DexEntry` (Mongo, ~global): mirrors many Showdown species fields plus `catchRate`, `expYield`, `evYields`, `expGrowth`, `baseHappiness`, `hatchCycles`, `sprites`, `isCanon`, `isPublic`, `originServer`, and ref-ified evo links (`{id, name}`).
- `Region.pokedex` slots reference DexEntry ObjectIds plus included forms.
- No items, moves, or TM models. The Region menu has "Moves" as a placeholder.
- The Showdown fork still carries 10 New Logora custom moves in base data files (the species were already reverted; see [14](14-battle-system-and-showdown.md#what-master-changes-vs-upstream-13-files-52793)).

## Layering (revised Oct 2026)

**Correction:** species, **moves, and learnsets must all live in the DB catalog**, not only in Showdown's code:
- Admins override canon Pokémon and write **custom learnsets**.
- Players need **move details** (power, accuracy, PP, type, category, effect text) to understand their moves.
- Moves are **assigned to TMs/HMs** per region.
- Piecemeal rules pick move data and learnsets **per generation**.

Showdown stays the **battle executor**. The DB is the **catalog of record** that authoring, display, validation, and the isolated custom-data dex all read from.

```
Layer 0  Canon import (from Showdown's dex + gen mods, pinned version) → seeds Layer 1; re-run on Showdown upgrades
Layer 1  Global catalog (Mongo)    → SpeciesDefinition (stats, types, sprites, catch rate, EXP yield/growth…),
                                     MoveDefinition (per-gen data + description text), Learnset (per species, per gen sources),
                                     ItemDefinition (pocket, price, field/battle use), AbilityDefinition (later gens)
Layer 2  Server content library    → original + linked entries (species, forms, learnsets, later moves/items/abilities); owned by the server
Layer 3  Region content (release)  → regional dex order, TM/HM list (TM slot → move), shop prices, item availability, starters, rules
Battle   Per release/format: assemble Layers 1–3 (+ chosen generations) → isolated Showdown dex injection
```

- **Per-generation data:** a `MoveDefinition` holds a base record plus per-gen overrides (e.g. Bite: Normal in Gen 1, Dark from Gen 2). Learnsets keep Showdown's per-gen source codes (`1L15`, `1M`, …), so `rules.data.learnsets: 'gen1'` filters to Gen 1 sources. Species stats follow the same pattern.
- **Overrides and custom learnsets** are *linked* library entries patching the canon learnset (add/remove moves, change levels), the same mechanism as species overrides (see Species identity below).
- **TMs/HMs:** a region's TM/HM list maps machine slots to `MoveId`s. Compatibility comes from the (possibly overridden) learnset's machine sources, or explicit additions in a custom learnset.
- **Showdown upgrades:** re-run the canon import, then diff. Changes to canon data reach regions at their next publish (releases pin catalog versions).

## Server content library (decided Oct 2026)

Custom content belongs to the **server**, not to a region. A region is one game, and a server can host several (sequels, side stories, remakes). A creator should be able to make a fakemon, custom move, or custom item once and use it in any of their regions without recreating it.

| Scope | Holds | Examples |
|---|---|---|
| **Global** (Layer 0–1) | Canon catalog + enrichment | Bulbasaur, Thunderbolt, Potion |
| **Server library** (Layer 2) | Custom species/forms/types/moves/abilities/items, plus reusable registries (trainer classes, custom encounter methods) | `newlogora:sparkitten`, a "Ranger" trainer class |
| **Region** (Layer 3, in the release) | Which library and canon entries this game *uses*, and how: regional dex order, TM list, shop prices, rules | "Kanto 2 uses Sparkitten as dex #152" |

Consequences:
- Region releases **reference** library entries by ID. They don't copy them. Publishing a region validates that every referenced library entry exists. Editing a library entry (e.g. rebalancing a fakemon's stats) affects every region that uses it at that region's next publish. The release pins a **library snapshot version**, so live play doesn't change under players until the admin republishes.
- The engine assembles one Showdown data set per **battle context**: each region release and each Arena format. Preferred delivery is **runtime injection into an isolated dex** (evolving the fork's `dynamic-dex-data` POC, see [14](14-battle-system-and-showdown.md#current-state-of-the-fork-branch-inventory-oct-2026)), not generated mod files. A server-wide mod can't work, because two regions on the same server may use different overrides of the same species (see below).
- Library content can also be **published for other servers to import** (private by default). See "Species identity" below.

## Species identity: canon, custom species, variants, overrides & sharing (decided Oct 2026, Q19)

Requirements from the owner:
- Global canon species.
- Servers can add their own species, plus **variants of existing species**.
- Servers can **publish** custom content for other servers to import (private by default).
- Everything must work in Showdown **without conflicting with canon**.
- An **override** of a canon species/form and the original **can't both be in one region**. If a creator wants both, the variant must be a separate **form**.

### Namespaces & publishers (decided Oct 2026)
The namespace in custom IDs is an **opaque, immutable publisher ID**. It's never a user-chosen handle, and it's not the raw Discord guild ID. A **presentation layer** shows a human name wherever IDs would surface.

```ts
Publisher {
  _id: string;                     // short opaque ID, e.g. 'p7k2m9x4'. The namespace in `<ns>:<slug>`. Never changes.
  displayName: string;             // defaults to the server name; changeable any time
  iconUrl?; description?;
  ownerServerIds: ObjectId[];      // MVP: exactly one (auto-created, lazily, the first time a server makes library content)
}
```

Why not the alternatives:

| Option | For | Against |
|---|---|---|
| User-chosen, set-once handle (`newlogora`) | Readable in raw IDs | Needs a claim flow, uniqueness checks, squatting/impersonation moderation, and "I regret my handle" support. It's permanent, so a typo or an outgrown name sticks forever. Readability only matters in raw IDs, which users shouldn't see. |
| Discord guild ID (`1010726453974925402`) | Already unique and immutable, no claim flow. This was the original plan. | Couples content identity to one Discord guild: if a creator rebuilds their server or moves to a new guild, their whole library's IDs point at a dead guild. It also ties IDs to Discord specifically. |
| **Opaque publisher ID + display name** (recommended) | No claim flow, no collisions, rename-safe. **Ownership can move** between servers (rebuilt server, a creator running two servers that share one library) without touching a single ID. | One small model. The UI must always resolve IDs to names (it should anyway). |

Presentation rules:
- Users see "Sparkitten · by **New Logora**" (publisher display name + icon), never `p7k2m9x4:sparkitten`.
- Display names don't need to be unique. Public browsing shows the icon, the server name, and later a "verified" badge for disambiguation.
- Raw IDs appear only in JSON export/import, logs, and developer tools, where the readable `slug` half is enough for humans.

MVP needs no publisher UI. It needs only the auto-created Publisher per server and name resolution in the builder.

### Two identities per species entry
| Identity | What it is | Used by |
|---|---|---|
| **Species ID** (in-game identity) | What a Pokémon *is*: `pikachu`, `newlogora:sparkitten`, `newlogora:pikachu-surfer` | Pokémon instances, encounter slots, trainer parties, regional dex, conditions, team presets |
| **Definition ref** (authoring identity) | *Which version of which library entry* supplies the data: `{ entryId, version }` | Region releases and Arena formats (what they compile), import/sharing, update notices |

They're usually 1:1. **Overrides** are the reason they're separate: an override is a library entry whose species ID *is a canon ID*.

### Two kinds of library entry: *original* and *linked* (decided Oct 2026)
Every library entry is one of two kinds. Overrides of canon and imports from other servers turn out to be **the same mechanism**: a *linked* entry, which is a pinned base definition plus a local patch.

| Kind | What it is | Species ID | Examples |
|---|---|---|---|
| **Original** | Data authored from scratch | `<ns>:<slug>` (the creator's namespace) | A new fakemon `newlogora:sparkitten`. A new **form** of an existing species `newlogora:pikachu-surfer` (`baseSpecies: Pikachu`, `forme: Surfer`). |
| **Linked** | `base` (a pinned definition: canon@dataVersion or another publisher's entry@vN) **+ `patch`** (local field changes, possibly empty) | **the base's ID** (unchanged) | **Canon override:** base = canon Pikachu, patch = new stats. **Import:** base = `newlogora:sparkitten@v3`, patch = {} or local tweaks. |

```ts
LibraryEntry {
  entryId; publisherId; visibility: 'private' | 'public';     // private by default
  subject: 'species';                                           // later: 'move' | 'ability' | 'item' | 'type'
  kind: 'original' | 'linked';
  // original
  speciesId?: `${ns}:${slug}`; versions?: { version; publishedAt; data; dependencies: DefinitionRef[] }[];  // immutable once published
  // linked
  base?: { ref: DefinitionRef; pinnedVersion: string };       // canon@<data version> or <ns>:<slug>@vN
  patch?: Partial<SpeciesData>;                                 // field-level local changes; effective = base ⊕ patch
  detachedFrom?: DefinitionRef;                                 // provenance after "detach"
}
```

- **`<ns>`** is the **publisher ID**: an opaque, immutable, system-generated ID (see "Namespaces & publishers" below). Examples in this doc use `newlogora` as a readable stand-in. A real ID looks like `p7k2m9x4:sparkitten`.
- Showdown IDs are lowercase alphanumeric only, so **any ID containing `:` can never collide with canon**, now or in future generations.
- A rename changes the display name, never the species ID.

### Why this fits Showdown naturally
A linked entry *is* Showdown's mod pattern: `inherit: true` + changed fields. Each region release / Arena format compiles its **own** mod, so:
- **A region using a linked entry** gets `base ⊕ patch` under the base's ID. Every content reference (`pikachu`, `newlogora:sparkitten` in encounter tables, trainer parties) picks it up with no reference changes. Switching between the original and a linked version never touches content.
- **The "not both in one region" rule is structural:** a region's species set maps each species ID to exactly one definition, so canon Pikachu and a linked (overridden) Pikachu can't coexist. The validator explains: "Pikachu is overridden by *Rebalanced Pikachu*. To use both, create it as a new form instead."

### Compiling to Showdown without name clashes
Inside one compiled mod, Showdown keys species by `toID(name)`. The compiler:
1. **Originals (species/forms):** emits the display name. If it collides with a canon name or another selected entry in the *same* region/format, publish is blocked with a "set a local display name" fix. (Two servers' "Sparkitten"s only clash if one region imports both.)
2. **Linked entries:** emit under the base's key with `inherit: true` + patch (for canon bases), or the base's compiled data + patch (for imported bases).
3. Keeps a per-release **translation table** (species ID ↔ Showdown ID) so battle logs map back to our IDs.

Future canon additions are safe: a new real "Sparkitten" just becomes a name clash, caught at that region's next publish. Existing instances keep `newlogora:sparkitten`.

### Importing from another server
1. **Import** creates a *linked* entry in your library: `base = author's entry @ latest published version`, `patch = {}`. It's immediately usable, and it's **editable locally**: any field you change goes into your patch. The author's data is never modified.
2. **Updates:** when the author publishes v4, you get a notice listing what changed. **Upgrading** re-pins the base to v4 and re-applies your patch:
   - Fields only the author changed → you get the new values.
   - Fields only you changed → your values stay.
   - Fields **both** changed → shown as conflicts; your value wins unless you pick theirs.
   Nothing changes until you upgrade, and live play only changes at your next region publish.
3. **Detach** (optional): flatten `base ⊕ patch` into an *original* under **your** namespace (new species ID, `detachedFrom` provenance). Use it when your version has become its own thing and you want to publish it yourself.
4. **Dependencies** (custom moves/abilities/types the species needs) import together as linked entries at pinned versions.
5. If the author **unpublishes or goes private**: you keep your pinned base (published versions are immutable). New imports stop, and you can still detach.

**Identity choice:** a linked entry keeps the base's species ID even with local tweaks, the same way a canon override keeps `pikachu`. A locally patched Sparkitten is still a Sparkitten that "works differently in this game". If cross-server trading or travel ever arrives, a Pokémon battles with the definition of the place it's in. Detaching is how a creator says "this is a different species now".

**Why not the alternatives:**
| Option | Problem |
|---|---|
| Pinned reference only (no local edits) | Fails the requirement: importers must be able to tweak locally. |
| Plain copy with a source link | Local edits are easy, but upstream updates become a manual re-import that loses your edits, and each copy needs a new ID (or else two servers own the same ID). |
| **Linked: pinned base + local patch** | Local edits *and* clean upgrades. Same mechanism as canon overrides. Keeps IDs stable. |

### Later: moves, abilities, items, types (post-MVP)
The same original/linked scheme applies, but it's deferred until custom moves/abilities/items are designed. Their behavior is code in Showdown, so patches must be limited to safe, data-only fields (power, accuracy, type, PP, effect chances) on existing behaviors.

### What happens to owned Pokémon when definitions change
- **Linked entries (overrides or tweaked imports):** the Pokémon's species ID is the base's ID either way. It battles with whatever definition the current region uses.
- **Version bumps / upgrades:** apply at the region's next publish, same as any content change ([01](01-content-vs-state-and-publishing.md)).
- **Deleted entry:** blocked while any published release or instance references it. Archive instead.

### Mongo shape
A species ID names what a Pokémon *is*. It is **not** a unique document key: a server library can hold several linked entries for `pikachu` (e.g. "Rebalanced Pikachu" for one region, "Hard-mode Pikachu" for another), and every server that imports Sparkitten holds an entry with the same ID.

| Where | Unique key | Species ID unique? |
|---|---|---|
| Canon catalog (`DexEntry`, later `SpeciesDefinition`) | `speciesId` (renamed from `showdownName`), plus the data version if more than one canon import is kept | Yes, among canon entries only |
| Server library | `entryId` (+ version) | No. Overrides and imports share IDs by design. |
| Region release | Its species map: each species ID → exactly one `DefinitionRef` | Yes, enforced by the publish validator, not a DB index |

- `_id` stays an ObjectId. All references store `speciesId` (plus a definition ref where pinning matters), never the `_id`.
- A region's Pokédex slot picks the definition: `{ speciesId: 'pikachu', definition: { entryId, version } }`. Instances, encounter slots, and trainer parties store only `'pikachu'`.
- The existing `isCanon` / `isPublic` / `originServer` fields map onto `kind`, `visibility`, and `ownerServerId`. Non-canon entries move to the library model instead of sharing the canon collection (the seed has none today).

## Items (the biggest catalog gap)
Showdown knows that Leftovers heal in battle. It doesn't know:
- what bag pocket an item belongs in
- what it costs or sells for
- that a Potion can be used from the bag outside battle
- that a Fire Stone evolves Vulpix
- what Repel and Escape Rope do
- that a Bicycle exists
- what TMs teach in *this* region

```ts
ItemDefinition {
  id: ItemId;                       // showdown id where one exists ('potion'), else custom ('x_bicycle')
  name; pocket: 'items' | 'medicine' | 'balls' | 'tms' | 'berries' | 'key' | string;
  buyPrice?; sellPrice?;            // region overlays override
  fieldUse?: Effect[] | FieldUseHandlerId;   // potion → heal target 20; rarecandy → levelUp; firestone → evolve
  battleUse?: BattleUseHandlerId;   // pokeball → catch(rate 1x); potion → heal (needs sim hook, see 14)
  holdable: boolean; consumable: boolean;
  teaches?: MoveId;                 // TMs/HMs (reusable in Gen 5+, so consumable=false)
}
```

**Region TM list:** `Region.moveMachines: { item: ItemId; move: MoveId; label: 'TM01' | 'HM01' }[]`. Compatibility comes from the species learnset.

## Learnsets & generation
Showdown learnsets are keyed by generation-specific sources (`8L15`, `7M`). A Region needs a **learnset policy**: "use Gen N learnsets" plus optional per-species overrides. Without it, "recreate RBY" vs "Gen 9 content" is ambiguous. This ties into the rules profile ([18](18-rules-time-and-randomness.md)).

## Custom content (Full / Pie-in-sky)
Your roadmap wants "custom fakemon, forms, and types per server: predictable, simple descriptor-field-fed data". Custom species need entries in pokedex, learnsets, formats-data, and (for types) the typechart. Path:
1. Custom content is stored in Mongo as server library entries (Layer 2) with the same descriptor fields.
2. At battle start, BattleService injects the release's or format's assembled data into an **isolated custom-data dex** (patch 4 in [14](14-battle-system-and-showdown.md#fork-strategy-options)). No mod files are generated, and nothing restarts on publish.
3. Custom *moves/abilities* are limited to retuning existing behaviors (your "strict dynamic templates" idea): a custom move inherits an existing move's mechanics plus overrides. Designing this is post-MVP (Q28).

## Where canon data lives (decided Oct 2026)

The **DB catalog is the record** (see Layering above): canon data is imported from a pinned Showdown version into Mongo, and the import is re-run and diffed on Showdown upgrades. Showdown stays the battle executor and receives the assembled data per battle context. The alternatives considered were "Showdown canonical, Mongo only enriches" (rejected: admins need overrides, custom learnsets, TM assignments, and readable move details) and a third-party API at runtime (latency, rate limits, no custom content).

## MVP scope
- Reference species/moves/items by Showdown ID. Rename DexEntry `showdownName` to `speciesId` and reference by it.
- ItemDefinition for the Gen 1 item set (balls, medicine, repels, escape rope, stones, key items, TMs/HMs) with field/battle handlers.
- Region TM list and learnset policy.
- Not MVP: custom species UI and custom moves. The isolated custom-data dex (M1) is still built for the MVP because piecemeal Gen 1 data and Arena formats use it.

## Open questions
- ~~What does `baseGeneration` control?~~ **Decided (Q26):** replaced by `RegionRules`; the default `10` is removed.
- ~~Sprite hosting?~~ **Decided (Q32):** the existing Imgur-hosted set behind a sprite-URL resolver, with Showdown's CDN as fallback.
- ~~Regional forms in MVP?~~ **Decided (Oct 2026):** the model supports them (pokedex slots already hold forms), but the builder doesn't offer them while a region's data rules are Gen 1. Kanto Classic doesn't need them, and many would fail Gen 1 type rules (no Dark, Steel, or Fairy).
