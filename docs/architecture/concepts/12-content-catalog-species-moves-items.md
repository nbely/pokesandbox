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
| **Server library** (Layer 2) | Custom species/forms/types/moves/abilities/items, plus reusable registries (trainer classes, custom encounter methods) | `x_<server>_sparkitten`, a "Ranger" trainer class |
| **Region** (Layer 3, in the release) | Which library and canon entries this game *uses*, and how: regional dex order, TM list, shop prices, rules | "Kanto 2 uses Sparkitten as dex #152" |

Consequences:
- Region releases **reference** library entries by ID. They don't copy them. Publishing a region validates that every referenced library entry exists. Editing a library entry (e.g. rebalancing a fakemon's stats) affects every region that uses it at that region's next publish. The release pins a **library snapshot version**, so live play doesn't change under players until the admin republishes.
- The **mod compiler** compiles the *server library* into one Showdown mod per server (`ps_<serverId>`). Regions and Arena formats on that server both battle with it.
- Library content is reusable across regions on the same server only. Sharing it across servers is a separate decision (Q23).

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
