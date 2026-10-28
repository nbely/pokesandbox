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
Layer 2  Custom content (Mongo, per server)    → fakemon, custom items/moves (Full / Pie-in-sky), compiled into a Showdown mod
Layer 3  Region content (release)              → regional dex order, TM list, shop prices, item availability, starters
```

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
