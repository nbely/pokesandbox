# 12: Content Catalog: Species, Moves, Items, TMs

> **TL;DR:** Treat **Showdown's dex as the canonical catalog** for battle data (species, moves, abilities, items, learnsets, typechart) and key everything by Showdown ID. Keep Mongo `DexEntry` as *enrichment* (sprites, flavor, catch rate, EXP yield, growth rate, which Showdown lacks) and as the store for custom species. Add an **ItemDefinition** layer for overworld behavior (bag pocket, price, field use), since Showdown items only know battle effects. Region-level overlays (pokedex, TM list, item availability, prices) live in region content.

**MVP impact:** High · **Cost to change later:** Medium

## Current shape
- `DexEntry` (Mongo, ~global): mirrors many Showdown species fields plus `catchRate`, `expYield`, `evYields`, `expGrowth`, `baseHappiness`, `hatchCycles`, `sprites`, `isCanon`, `isPublic`, `originServer`, and ref-ified evo links (`{id, name}`).
- `Region.pokedex` slots reference DexEntry ObjectIds plus included forms.
- No items, moves, or TM models. The Region menu has "Moves" as a placeholder.
- The Showdown fork carries New Logora fakemon in base data files.

## Layering

```
Layer 0  Showdown Dex (code, pinned version)  → battle truth: stats, types, moves, abilities, items-in-battle, learnsets
Layer 1  PokeSandbox catalog (Mongo, global)   → DexEntry enrichment + ItemDefinition (pocket, price, field use) + Move enrichment (TM/tutor metadata)
Layer 2  Server content library (Mongo)        → fakemon, forms, custom types/items/moves, trainer classes; owned by the SERVER, reusable by every region on it
Layer 3  Region content (release)              → regional dex order, TM list, shop prices, item availability, starters (selects from Layers 0–2)
```

## Server content library (decided Oct 2026)

Custom content belongs to the **server**, not to a region. A region is one game, and a server can host several (sequels, side stories, remakes). A creator should be able to make a fakemon, custom move, or custom item once and use it in any of their regions without recreating it.

| Scope | Holds | Examples |
|---|---|---|
| **Global** (Layer 0–1) | Canon catalog + enrichment | Bulbasaur, Thunderbolt, Potion |
| **Server library** (Layer 2) | Custom species/forms/types/moves/abilities/items, plus reusable registries (trainer classes, custom encounter methods) | `newlogora:sparkitten`, a "Ranger" trainer class |
| **Region** (Layer 3, in the release) | Which library and canon entries this game *uses*, and how: regional dex order, TM list, shop prices, rules | "Kanto 2 uses Sparkitten as dex #152" |

Consequences:
- Region releases **reference** library entries by ID. They don't copy them. Publishing a region validates that every referenced library entry exists. Editing a library entry (e.g. rebalancing a fakemon's stats) affects every region that uses it at that region's next publish. The release pins a **library snapshot version**, so live play doesn't change under players until the admin republishes.
- The **mod compiler** builds one Showdown mod per **battle context**: each region release and each Arena format. A server-wide mod can't work, because two regions on the same server may use different overrides of the same species (see below).
- Library content can also be **published for other servers to import** (private by default). See "Species identity" below.

## Species identity: canon, custom species, variants, overrides & sharing (proposed Oct 2026)

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

### The three kinds of custom species entry
| Kind | Species ID | Showdown name in the compiled mod | Example |
|---|---|---|---|
| **New species** (fakemon) | `<ns>:<slug>` | its display name ("Sparkitten") | `newlogora:sparkitten` |
| **New form of an existing species** (canon or custom base) | `<ns>:<base>-<form>` | "Pikachu-Surfer" (`baseSpecies: Pikachu`, `forme: Surfer`) | `newlogora:pikachu-surfer` |
| **Override** of a canon species or form | **the canon ID** (`pikachu`, `raichualola`) | the canon name (`inherit: true` + changed fields) | a server's rebalanced Pikachu |

- **`<ns>`** is the **publisher ID**: an opaque, immutable, system-generated ID (decided Oct 2026; see "Namespaces & publishers" below). No one chooses or claims it. Examples in this doc use `newlogora` as a readable stand-in. A real ID looks like `p7k2m9x4:sparkitten`.
- Showdown IDs are lowercase alphanumeric only, so **any ID containing `:` can never collide with canon**, now or in future generations.
- A rename changes the display name, never the species ID.

### Why overrides fit Showdown naturally
Showdown mods already work this way: a mod entry with `inherit: true` replaces the base entry for battles using that mod. Because each region release / Arena format compiles its **own** mod:
- **Region with the override:** its mod replaces `pikachu`. Every content reference (`pikachu` in encounter tables, trainer parties) picks up the override with no reference changes. Toggling the override on or off never touches content.
- **Region without it:** gets canon Pikachu.
- **The "not both in one region" rule is structural:** a region's species set maps each species ID to exactly one definition, so the original and the override literally can't coexist. The validator explains: "Pikachu is overridden by *Rebalanced Pikachu*. To use both, create it as a new form instead."

### Compiling to Showdown without name clashes
Inside one compiled mod, Showdown keys species by `toID(name)`. The compiler:
1. **New species/forms:** emits the display name. If it collides with a canon name or another selected entry in the *same* region/format, publish is blocked with a "set a local display name" fix. (Two servers' "Sparkitten"s only clash if one region imports both.)
2. **Overrides:** emit under the canon key with `inherit: true`.
3. Keeps a per-release **translation table** (species ID ↔ Showdown ID) so battle logs map back to our IDs.

Future canon additions are safe: a new real "Sparkitten" just becomes a name clash, caught at that region's next publish. Existing instances keep `newlogora:sparkitten`.

### Sharing & import
```ts
LibraryEntry {
  entryId; kind: 'species' | 'form' | 'override' | 'move' | 'ability' | 'item' | 'type';
  publisherId; speciesId /* or moveId… */; 
  visibility: 'private' | 'public';              // private by default
  versions: { version; publishedAt; data; dependencies: DefinitionRef[] }[];  // immutable once published
  derivedFrom?: DefinitionRef;                    // set when forked from someone else's entry
}
ServerLibrary.imports: { ref: DefinitionRef; pinned: true }[]
```
- **Import = pinned reference**, not a copy. The importer uses `<author-ns>:<slug>@v3`, gets "v4 available" notices, and upgrades explicitly. Species IDs stay the author's, so Pokémon stay the same species if cross-server features (trading, travel) ever arrive.
- **Fork = copy to edit.** It creates a new entry under the importer's own namespace with `derivedFrom`. It's a different species ID (or an override, if it targets a canon ID).
- **Dependencies** (custom moves, abilities, types a species needs) are imported as a closure, at pinned versions.
- If the author **unpublishes or goes private**, existing importers keep their pinned versions (published versions are immutable), but new imports stop.
- Moves, abilities, items, and types follow the same three-kind scheme (new / variant / override) and the same sharing rules.

### What happens to owned Pokémon when definitions change
- **Override, region-level:** a Pokémon's species ID is `pikachu` either way. If cross-region travel/trading ever exists, it battles with the *destination's* Pikachu definition. That's the intended meaning of an override: "Pikachu works differently in this game".
- **Library version bump:** applies at the region's next publish, same as any content change ([01](01-content-vs-state-and-publishing.md)).
- **Deleted entry:** blocked while any published release or instance references it. Archive instead.

### Mongo shape
- `DexEntry` becomes `SpeciesDefinition`: `_id` stays an ObjectId per **(speciesId, version)** document, with a unique index on `{ speciesId, version }`.
  - Canon docs use `speciesId = showdown id` and the data version.
  - All references store `speciesId` (plus a definition ref where pinning matters), never the `_id`.
- The existing `isCanon` / `isPublic` / `originServer` fields map onto `kind`, `visibility`, and `ownerServerId`.

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
Your roadmap wants "custom fakemon, forms, and types per server: predictable, simple descriptor-field-fed data". Showdown loads mods from `data/mods/<id>` at startup, and custom species need entries in pokedex, learnsets, formats-data, and (for types) the typechart. Path:
1. Custom species are stored in Mongo (Layer 2) with the same descriptor fields.
2. A **mod compiler** generates a Showdown mod (`data/mods/ps_<server>/…`) from Mongo on publish, or injects into a ModdedDex at runtime (`dex.loadData()` cache patching). Generated files are safer. Battle workers reload mods on publish.
3. Custom *moves/abilities* are limited to retuning existing behaviors (your "strict dynamic templates" idea). That works naturally: a custom move is `inherit` from an existing move plus overrides.

This is why **New Logora content should move out of base data files into a mod** now (see [14](14-battle-system-and-showdown.md)). It proves the path.

## Options: where canon data lives

| Option | Pros | Cons |
|---|---|---|
| A. Mongo is canonical (seeded from Showdown) | Queryable, editable | Two sources of truth for battle data. Drifts on Showdown upgrades. |
| **B. Showdown canonical; Mongo enriches** (recommended) | One battle truth. Upgrades are a version bump plus an enrichment backfill. | Some fields (catch rate, EXP yield) need a separate data source (PokeAPI/Bulbapedia-derived seed). That data already exists in DexEntry. |
| C. Third-party API at runtime (PokeAPI) | No data to host | Latency, rate limits, availability. Custom content impossible. |

## MVP scope
- Reference species/moves/items by Showdown ID. Add `speciesId` to DexEntry.
- ItemDefinition for the Gen 1 item set (balls, medicine, repels, escape rope, stones, key items, TMs/HMs) with field/battle handlers.
- Region TM list and learnset policy.
- Not MVP: custom species UI, mod compiler (but do the New Logora → mod refactor as the spike that proves it).

## Open questions
- What's **`baseGeneration`** meant to control: dex scope, learnsets, mechanics, or sprites? (The code defaults it to `10`.)
- Do you want **regional forms/variants** (Alolan etc.) slot-able in MVP? The pokedex slot model supports forms already.
- Sprite hosting: Showdown's sprite CDN (`play.pokemonshowdown.com/sprites`) vs self-hosted? (Legal and availability considerations.)
