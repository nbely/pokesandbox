# Decision Log: ChatGPT Architecture Sessions

A condensed record of what was decided in the "PokeSandbox DB Architecture" ChatGPT conversation (Feb–Mar 2026). The transcript itself isn't kept in the repo.

Status legend: **Built** (in `shared/src/models` today) · **Agreed** (decided, not built) · **Floated** (discussed, no decision) · **Revisit** (this audit proposes changing it; see the linked concept doc).

## Progression

| # | Decision | Status | Notes / audit stance |
|---|----------|--------|----------------------|
| P1 | Progression definitions stay **embedded on Region** (no separate collection). Templates are handled by cloning a whole region. | Built | Fine. See [04-progression-and-flags](concepts/04-progression-and-flags.md). |
| P2 | Use **one map with a `kind` discriminator**, not separate maps per kind. | Built | Fine. |
| P3 | MVP kinds: `numeric`, `milestone`, `boolean`. Add `tieredNumeric`/`set` later. | Built | Your roadmap adds a **`choice` (enum)** kind. It's not in code yet. |
| P4 | Field renamed `progressionTypes` → `progressionDefinitions`. Spell out names in schemas. | Built | — |
| P5 | `visibility: public \| discoverable \| hidden` replaces `hidden: boolean`. | Built | — |
| P6 | Milestone `key` is a hidden, generated unique ID, separate from the user-facing `label`. | Built (`milestone-<uuid>`) | Progression keys are bare UUIDs. See [02-identity-and-references](concepts/02-identity-and-references.md). |
| P7 | Empty milestone arrays allowed (author now, fill in later). Numeric `min` has no forced default. | Built | Deploy validation should flag empty ladders that a requirement references. |
| P8 | **Character stores state, Region stores meaning.** `progress: Map<key, unknown>`, interpreted through the definition. | Agreed | Character model not built yet. |
| P9 | Unlock rules live on the entity being unlocked (location, shop, quest), not on the progression definition. | Agreed | Fine. |

## Requirements & Effects

| # | Decision | Status | Notes / audit stance |
|---|----------|--------|----------------------|
| R1 | Requirements are a **shared embedded schema**, not a collection. | Built (`requirement.ts`) | Fine on storage. **Revisit the shape**: it's bucketed and AND-only. See [05-requirements](concepts/05-requirements.md). |
| R2 | Requirement buckets: `progressions` (record of `{min,max}` or `{equals}`), `items`, `capabilities` (`pokemon_move`, `party_size`). | Built | No OR/NOT, no time/visited/flag/choice predicates, and `equals` is loosely typed. |
| R3 | Location-level requirements ("can I be here") are separate from connection-level requirements ("can I take this path"). | Built | Fine. |
| R4 | `is_in_visited` is a **legitimate requirement predicate** evaluated against player state (you pushed back and ChatGPT agreed). | Agreed | Supported. Generalize to contextual predicates (`$target`). |
| R5 | Effects are a reusable primitive (currency, items, progression, flags, later teleport/quest-trigger). Costs are modeled as effects. | Agreed | Not built. See [06-effects](concepts/06-effects.md). |

## World graph

| # | Decision | Status | Notes / audit stance |
|---|----------|--------|----------------------|
| W1 | Locations are graph nodes; **connections are directional edges** stored on the source location. | Built | Fine. |
| W2 | The builder may offer a "two-way" toggle that writes both edges. The schema stays directional. | Agreed | Not built (Connections button is "coming soon"). |
| W3 | Sub-areas (Mt. Moon floors) and buildings (gyms, houses) are **their own location nodes**. | Agreed | Add `kind` + `parentLocationId` for grouping. See [08-world-graph](concepts/08-world-graph-locations.md). |
| W4 | Quests are **not** listed on Location. Quests reference where they trigger. | Agreed | Region still carries `quests.active/passive` arrays. Revisit. |
| W5 | Wild tables are grouped by method, then time-of-day blocks, then weighted slots. | Built | Method enum is hardcoded and includes `gift`. See [10-encounters](concepts/10-encounters.md). |
| W6 | `startingLocationId` lives on Region; `currentLocationId`/`respawnLocationId`/`visitedLocationIds` live on Character. | Agreed | Not built. |
| W7 | Location keeps `trainerIds`. | Built | **Revisit:** NPC placement should point at the location (one direction). |

## Trainers, NPCs, transportation

| # | Decision | Status | Notes / audit stance |
|---|----------|--------|----------------------|
| T1 | The rival is a **Trainer** with multiple teams, referenced by quests/events. | Agreed | Your roadmap refines this into party variants conditioned on progressions. See [11-npcs-trainers](concepts/11-npcs-trainers-and-battle-definitions.md). |
| T2 | Transportation is a separate model built on **hubs**, with its own requirements and effects. No per-location overrides. | Agreed | Fine. See [09-transportation](concepts/09-transportation.md). |
| T3 | Simple point-to-point travel (e.g. a train between two regions) can just be a connection with a fare effect. | Agreed | Fine. |

## Conventions

| # | Decision | Status |
|---|----------|--------|
| C1 | Zod entity schema is the source of truth. Mongoose schemas mirror it. Naming is `fooSchema` (zod) and `fooDbSchema` (mongoose). | Built |
| C2 | Embedded sub-schemas are standalone `Schema` consts with `{ _id: false }`. | Built |
| C3 | Maps are hydrated with `zMapHydrator`. | Built |

## Floated, never decided

These came up in the "future models" list at the end of the conversation: NPC (separate from Trainer), Item, BattleDefinition, Event, DialogueTree, Achievement, Faction, EncounterModifier, MapMarker, LootTable, Script/Trigger. The audit takes a position on each:

- **Item** and **NPC**: needed for MVP.
- **Script/Trigger**, **DialogueTree**, **BattleDefinition**, and **Event**: collapse into a single [Script system](concepts/07-scripts-triggers-and-events.md).
- **EncounterModifier**: becomes a condition on encounter tables.
- **LootTable**: becomes a weighted-random effect.
