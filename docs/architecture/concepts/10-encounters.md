# 10: Wild Encounters

> **TL;DR:** Turn the hardcoded `encounterType` enum into a **region-configurable method registry** (grass, cave, surf, rods, headbutt, rock smash, …), each with its own `condition` (e.g. Surf needs the move plus a badge) and encounter rate. Generalize `timeOfDay` blocks into **conditioned tables** (time, flags, progression, weather, swarms). Move static/gift Pokémon to scripts.

**MVP impact:** High (it's the core loop) · **Cost to change later:** Medium

## Current shape (built)
```ts
wildTables: {
  encounterType: 'grass' | 'surf' | 'old_rod' | 'good_rod' | 'super_rod' | 'rock_smash' | 'gift',
  timeBlocks: { timeOfDay: 'morning' | 'day' | 'evening' | 'night' | 'any', slots: { speciesId: ObjectId, minLevel, maxLevel, weight }[] }[]
}[]
```

## Gaps

| Gap | Example |
|---|---|
| Hardcoded methods | Headbutt (Gen 2), Dark grass (Gen 5), Hordes (Gen 6), SOS (Gen 7), overworld-visible spawns (LGPE/SwSh/SV) |
| `gift` isn't a wild method | Gifts are scripts with `givePokemon` |
| Time is the only variant axis | Swarms (flag/daily), post-game tables (milestone), weather (Gen 8), Pokéradar, version-exclusive tables (choice!), radio station music (Gen 2) |
| No encounter rate per method | How often "Explore" finds something vs nothing (and whether Repel suppresses it) |
| No per-slot form/gender/shiny/held-item | Wild Pikachu holding a Light Ball. Alolan forms. |
| Species by ObjectId | See [02](02-identity-and-references.md) |

## Proposed shape
```ts
// Region-level registry (with canon defaults seeded)
EncounterMethod { id: 'grass' | 'surf' | 'old-rod' | string; name; icon?; condition?: Condition; rate: number; repelAffected: boolean }

// Location-level
EncounterTable {
  method: EncounterMethodId;
  condition?: Condition;            // time of day, flags, milestones, choice, weather…
  priority?: number;                // first matching table per method wins (swarm table > default)
  slots: { species: SpeciesId; form?; minLevel; maxLevel; weight; heldItem?: { item, chance }[]; shinyRateMultiplier? }[];
}
```

`timeOfDay` stays as a *condition predicate* (`{ type: 'time', of: ['night'] }`), so it composes with everything else.

### Encounter loop (game-dev)
Options for how wild encounters trigger in a text game:
1. **On-demand "Explore" button** per method (Walk in grass / Fish with Old Rod / Surf): roll the rate, then roll a slot. Simple, player-paced, grindable.
2. **On traversal**: moving along a route rolls encounters (adds tension, slows travel).
3. **Visible spawns**: show 3 Pokémon "in the grass" and the player picks one to engage (modern feel, reduces RNG frustration, great for Discord).

Recommendation: (1) for MVP, plus a **Repel** status (N explores without encounters below the lead's level). Design the resolver so (3) is a later presentation over the same tables.

### Static & special encounters
Snorlax, legendaries, Electrode "items", and Voltorb traps are **scripts** with `wildBattle` steps, gated by flags. They're not table entries.

## MVP scope
- Method registry with canon defaults (grass, cave, surf, old/good/super rod).
- Conditioned tables, the "Explore" action, the Repel effect, and the encounter-rate setting.
- A wild battle that hands off to the battle system with catch/run/bag (see [14](14-battle-system-and-showdown.md)).

## Open questions
- What's the **time model** for day/night? Real-world clock in the server's timezone, a per-character clock, or an accelerated in-game clock? See [18](18-rules-time-and-randomness.md).
- Should **level scaling** exist (encounter levels relative to badges/party, like SV) as a region option?
