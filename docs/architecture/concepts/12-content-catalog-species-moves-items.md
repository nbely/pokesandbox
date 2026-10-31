# 12: Content Catalog: Species, Moves, Items, TMs

> **TL;DR:** The **DB catalog is the record** for species, moves, learnsets, and items, imported from a pinned Showdown version with per-generation data and keyed by Showdown ID. Showdown stays the **battle engine**: it receives assembled data per battle and runs all move behavior. **ItemDefinition** adds overworld behavior (bag pocket, price, field use) that Showdown items lack. Custom content lives in a **server library** (original and linked entries). Region-level choices (regional dex, TM/HM list, item availability, prices) are region content.

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
| **Opaque publisher ID + display name** (chosen) | No claim flow, no collisions, rename-safe. **Ownership can move** between servers (rebuilt server, a creator running two servers that share one library) without touching a single ID. | One small model. The UI must always resolve IDs to names (it should anyway). |

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

## Moves: import, overrides, and Showdown callbacks (decided Oct 2026)

### How Showdown stores per-generation moves
- Each generation is a **mod** (`data/mods/gen1` … `gen8`; base `data/` is Gen 9), chained through `scripts.ts`: `gen1` inherits `gen2`, which inherits `gen3`, up to base.
- A mod's data files hold only differences. When the Dex loads a mod (`ModdedDex.loadData()`), a **missing** entry is taken from the parent, an entry with **`inherit: true`** is merged with the parent's (child keys win), and **`null`** removes it.
- A mod's `scripts.ts` can also change data in code through `init()`. Gen 3's re-derives every move's category from its type (the pre-Gen 4 physical/special rule).
- Entries can contain **functions** (`onHit`, `basePowerCallback`, `onModifyType`, …). That's behavior, not data.
- Text lives in `data/text/moves.ts`, with per-gen blocks (`gen1: { desc, shortDesc }`).

### Import (M1)
1. Load the pinned Showdown version and, for each generation 1–9, its **resolved** Dex (`Dex.mod('genN')`, base for Gen 9). Never parse the raw files: resolution applies the inheritance merge and `init()`, so per-gen values (Gen 1 Bite is Normal; Gen 3 Shadow Ball is Physical) come out correct with no display-time logic.
2. Keep data fields only (type, category, base power, accuracy, PP, priority, target, flags, secondary effects, crit ratio, multi-hit, recoil/drain, …) and drop functions.
3. Store the Gen 9 record as `base` and each older generation's **differences** as `genOverrides[gen]`. `isNonstandard` is one of the data fields, so per-gen availability (`Past`, `Future`) comes along in the overrides.
4. Record **`hooks`** per generation: the names of the move's behavior callbacks (`['basePowerCallback', 'onModifyType']`). Just names, no code. The builder uses them to explain which fields an override can't change.
5. Text: `desc` and `shortDesc` as resolved by each generation's Dex (from `data/text/moves.ts`), stored in `text`, with older generations' differences in `text.genOverrides`.
6. Main-series mods only (`gen1`–`gen8` + base). Side mods (`gen1stadium`, `gen7letsgo`, `gen8bdsp`, …) are skipped for now; they're candidates for later rule presets. Output is deterministic (sorted keys) so a re-import after a Showdown upgrade is a readable diff.

```ts
MoveDefinition {
  moveId: MoveId;                 // unique; Showdown toID
  num: number; name: string;
  introducedGen: number;          // Showdown's `gen` field
  base: MoveData;                 // the resolved Gen 9 record (base Dex)
  genOverrides: Partial<Record<GenId, Partial<MoveData>>>;   // per resolved gen Dex, only the fields that differ from `base`
  text: {                         // from data/text/moves.ts, under Showdown's own field names
    desc: string; shortDesc: string;                          // Gen 9 text
    genOverrides?: Partial<Record<GenId, { desc?: string; shortDesc?: string }>>;   // e.g. gen1: { shortDesc: "10% chance to make the target flinch." }
  };
  hooks: Partial<Record<GenId, string[]>>;                    // names of behavior callbacks (basePowerCallback, onHit, …); no code
  source: { showdownVersion: string };
}

MoveData = {
  // Data fields from data/moves.ts: only the fields Showdown actually has, all plain data
  type; category: 'Physical' | 'Special' | 'Status'; basePower; accuracy: number | true;
  pp; priority; target; flags; secondary?; secondaries?; critRatio?; multihit?; recoil?; drain?; …;
  isNonstandard?: string | null;  // null = available; 'Past' (removed in that gen), 'Future', … Per gen via genOverrides.
                                  // Moves that are 'CAP' (fan-made) in every gen aren't imported at all.
}
```
- **Text has its own sub-field**, mirroring Showdown's split between `data/moves.ts` (data) and `data/text/moves.ts` (text). `MoveData` stays exactly what a battle uses (what overrides patch and custom-move recipes change), and `text` can later become per-language without touching battle data. `resolveMove(def, gen)` merges both override maps and returns data and text together. The resolved Dex already applies Showdown's text fallback (a generation without its own block uses the nearest older-generation block above it, then the current text).
- **Availability is `isNonstandard`**, so it's per generation through `genOverrides` too, with no separate map.
- **Battle message templates** in the same text file (`start`, `activate`, `end`, `damage`, …) aren't stored. The battle renderer reads them from Showdown at runtime ([26](26-discord-surface-and-ux-patterns.md#battles)); custom moves (post-MVP) inherit their template move's messages.

### Behavior stays in Showdown
The catalog never replicates callbacks. At battle time the isolated custom-data dex is a child of the region's mechanics-gen mod, so canon moves keep Showdown's own callbacks, including that generation's versions.

### Overrides (post-MVP)
A region's override of a canon move (a *linked* library entry) is injected as `{ inherit: true, …changedFields }`. Showdown's merge keeps every key the override doesn't set, **callbacks included**, so "Thunderbolt at 95 power" behaves normally. Some fields are **controlled by callbacks** (power for Low Kick, Return, Gyro Ball, Eruption via `basePowerCallback`; type for Weather Ball and Hidden Power via `onModifyType`/`onModifyMove`; hit counts). The builder reads `hooks` and blocks or explains those fields ("this move's power is calculated, so a power override has no effect").

### Custom moves (post-MVP, Q28)
- A custom move (`<ns>:<slug>`) **borrows an existing move's mechanics and changes data only**. At battle time its dex entry is built from the template move's entry (functions included) with the overrides applied, under the new ID.
- **Store a recipe, not functions:** `{ template: MoveId; overrides: Partial<MoveData> }`. Battles are persisted as seed + input log and replayed on recovery, so everything crossing into a battle must be serializable; functions are re-attached when the dex is built.
- **Templates come from a curated list of archetypes**, not any move: plain damage; damage + secondary effect (status, flinch, stat drop); stat changes; multi-hit; recoil; drain; priority; status-only. Some Showdown behavior is keyed by move ID elsewhere (Gust hitting targets mid-Fly, Metronome's exclusion lists), so a copy of an arbitrary move could silently lose interactions. Each archetype gets a sim test.

## TM/HM lists (decided Oct 2026)
Machine numbering is per generation (Gen 1 TM01 is Mega Punch; Gen 2 TM01 is DynamicPunch), so a machine's move can't live on a global item. Machines are **region content** (Layer 3):

```ts
Region.moveMachines: { label: string;               // 'TM01', 'HM02'; unique within the region
                       kind: 'tm' | 'hm';
                       move: MoveId;
                       reusable: boolean }[]        // Gen 1: TMs single-use, HMs reusable
```
- **Bag items** for machines use a reserved item namespace, `machine:<label>` (e.g. `machine:tm24`), resolved through the region's list for display ("TM24 Thunderbolt") and use. One generic machine `ItemDefinition` (pocket `tms`, field use "teach") covers them all, so there are no per-region item documents.
- **Compatibility** ("can this Pokémon learn TM24?") comes from the region's learnset generation: Showdown's machine sources (`1M` = a TM/HM in Gen 1), plus additions in custom learnsets. The Kanto Classic list (numbering) comes from the template generator, since Showdown doesn't store TM numbers.
- **Validation:** labels unique, every move exists and is available in the region's move generation, and each machine has at least one compatible species in the regional dex (warning).

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
}
```

Machines (TMs/HMs) are region content resolved through `machine:<label>` item IDs, not items with a fixed move (see TM/HM lists above).

## Learnsets & generation (decided Oct 2026)

### Canon: Showdown's source codes, one document per species
```ts
Learnset { speciesId: 'pikachu'; moves: Record<MoveId, string[]>;     // e.g. thunderbolt: ['9M', …, '1M'], thundershock: ['9L1', …, '1L1']
           source: { showdownVersion } }
```
Each code is `<gen><method><detail>`: `1L15` = Gen 1 level-up at 15, `1M` = Gen 1 TM/HM, `2T` = Gen 2 tutor, `3E` = Gen 3 egg move, `4S0` = Gen 4 event (index into the species' event data), `7V` = Virtual Console transfer. One document holds every generation; the region's learnset policy (`RegionRules.data.learnsets`, [18](18-rules-time-and-randomness.md)) picks which one applies.

### Resolved learnsets: the shape everything else uses
Nothing outside the catalog reads raw codes. A learnset is first **resolved** for one generation into a simple, generation-free shape:
```ts
ResolvedLearnset {
  levelUp: { level: number; move: MoveId }[];   // sorted by level; a move can appear at several levels
  machine: MoveId[];                            // TMs/HMs
  tutor: MoveId[]; egg: MoveId[]; event: MoveId[];
}
resolveLearnset(learnset, gen) → ResolvedLearnset
```
Move display, trainer default movesets ([11](11-npcs-trainers-and-battle-definitions.md)), level-up move prompts, and TM/HM compatibility ([TM/HM lists](#tmhm-lists-decided-oct-2026)) all read the resolved form.

### Overrides and custom learnsets (post-MVP)
- **A canon override** is a *linked* library entry ([Species identity](#species-identity-canon-custom-species-variants-overrides--sharing-decided-oct-2026-q19)): a pinned base (the canon learnset at a catalog version, resolved for a generation) plus a **patch on the resolved form**:
  ```ts
  LearnsetPatch {
    add?:     { move: MoveId; method: 'levelUp' | 'machine' | 'tutor' | 'egg'; level?: number }[];
    remove?:  { move: MoveId; method?: 'levelUp' | 'machine' | 'tutor' | 'egg' }[];   // no method = remove entirely
    relevel?: { move: MoveId; from: number; to: number }[];
  }
  effective = applyPatch(resolveLearnset(base, gen), patch)
  ```
- **Why patch the resolved form, not codes:** it matches how authors think ("Charmander learns Flamethrower at 30", "remove Fly from Charizard's TMs"); a region only ever uses one generation, so per-gen codes would be noise; and it keeps the builder simple.
- **Upgrades** use the same three-way merge as species overrides: changes only the base made are taken, local changes stay, and conflicts are shown. The base records which generation it was resolved for, so changing a region's learnset generation re-resolves the base and re-applies the patch.
- **Custom species** (originals, `<ns>:<slug>`) author a `ResolvedLearnset` directly, with no codes or generations.
- **One definition per species per region,** like species overrides: a server can hold several learnset overrides for `pikachu`, and each region picks one.
- **TM compatibility follows automatically:** a patch adding Surf to `machine` makes that species compatible with the region's Surf machine.

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
