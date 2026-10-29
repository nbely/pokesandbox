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

## Decisions (Oct 2026, Q3)

### Explore is the core loop, and it always finds *something*
MVP uses **Explore buttons per method** ("Walk in the grass", "Fish", "Surf"). A press never yields "nothing happened". It rolls a location's **explore outcome table**:

```ts
Location.explore: {
  outcomes: (
    | { kind: 'wild';    method: EncounterMethodId; weight: number }       // uses the location's encounter tables
    | { kind: 'trainer'; weight: number }                                  // an undefeated NPC trainer here with engagement 'onExplore'
    | { kind: 'item';    weight: number }                                  // a hidden-item pickup here not yet taken (one-time, flag pickup:<key>:taken)
    | { kind: 'aside';   weight: number }                                  // POST-MVP: one-time flavor scripts (see below)
  )[];
}
```
- Exhausted outcomes drop out and the remaining weights renormalize. Once all trainers are beaten and all items found, Explore yields wild encounters only.
- **Asides (post-MVP):** short one-time scripts in place of "nothing happened". A description of the area, a cute or eerie moment, a fleeting NPC. Ordinary scripts with `once`, authored per location. They make the world feel alive without wasting the player's time.
- Repel suppresses only `wild` outcomes below the lead's level.

### Traversal requirements (MVP, decided Oct 2026)
Authors can make moving through a location cost something. Explore presses are how players pay it. Two kinds of cost, which can be combined:
- **One-time route costs** (first pass only), e.g. the unavoidable trainers on a route, or "fight 5 wild Pokémon your first time through".
- **Permanent minimum costs** (every pass), e.g. caves you can't cross without walking through them, unlike grass routes you can skirt.

```ts
Location.traversal?: {
  exits: ContentKey[] | 'all';                 // which outgoing edges are gated (direction matters: north exit vs south exit)
  firstPass?: {                                // one-time: must be met once, then never again
    trainers?: ContentKey[];                   // specific unavoidable trainers that must be defeated
    trainerBattles?: number; wildBattles?: number; explores?: number;
  };
  everyPass?: { explores: number };            // permanent minimum per visit, counted in *explores* (steps), not battles
}
```
**Why permanent costs count explores, not battles:** a Repel should still help in caves, as in the games. With a Repel active, an explore press that would have rolled a weak wild Pokémon resolves as a **safe step** ("You press deeper into the cave…"). It still counts toward `everyPass.explores`, but no battle happens. If permanent costs counted *battles*, Repel would make a cave impassable.

The **first pass** must satisfy both `firstPass` and `everyPass`. Later passes only need `everyPass`. Locations without `traversal` are free to cross.

How it maps onto existing primitives (no special engine path):
- The engine keeps per-character **location progress**: `{ cleared: boolean; lifetime: Counters; visit: Counters }`, where `visit` resets on each entry. Updated by engine event listeners: wild battle finished, trainer defeated, explore pressed.
- Condition facts `location.cleared` and `location.visit.<counter>`, scoped to the location being exited, are added to the **MVP fact list** ([05](05-requirements.md#mvp-scope)).
- The builder compiles `traversal` into **gates on the exit edges** (`presentation: 'attemptable'`, explanation e.g. "Defeat Bug Catcher Rick and 1 more trainer to continue", "Keep exploring: 2 more steps to get through Mt. Moon"). Reaching `firstPass` sets `cleared = true`.
- Unavoidable trainers can also use `engagement: 'onEnter'` (they battle you as you arrive). Traversal is for "you can't leave until…".

### "Encounters while travelling" (option B): decided no
Option B means **the trip itself can be interrupted**. You pick "Go to Viridian City" from Route 1, and the engine rolls encounters *along the way* (e.g. a chance per step of the route's length). You might be ambushed by a Rattata or a trainer before arriving, and you can't decline the encounter except via Repel or running. With option A (MVP), choosing a destination moves you instantly, and encounters only happen when you press Explore. **Decision: B won't be built.** Authors who want routes to cost something every time use `traversal.everyPass` instead.

## MVP scope
- Method registry with canon defaults (grass, cave, surf, old/good/super rod).
- Conditioned tables, the explore outcome table (wild/trainer/item), the Repel effect (with safe steps), and the encounter-rate setting.
- Traversal requirements (one-time and permanent costs) compiled into exit gates.
- A wild battle that hands off to the battle system with catch/run/bag (see [14](14-battle-system-and-showdown.md)).

## Open questions
- ~~Day/night time model?~~ **Decided (Q6):** none for the Kanto MVP (tables use `any`). The injected Clock defaults to real time in the server's timezone when Gen 2+ content needs it. See [18](18-rules-time-and-randomness.md).
- ~~Level scaling?~~ **Decided (Oct 2026):** post-MVP. `RegionRules.systems.levelScaling` is reserved so it can be added later without reshaping data ([18](18-rules-time-and-randomness.md)).
