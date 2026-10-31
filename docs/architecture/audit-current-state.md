# Current-State Audit: Models & Commands

Snapshot as of `master@a19f377` (Apr 2026), `pokemon-showdown@c668f79`. Reviewed through two lenses: **architect** (data integrity, coupling, scale, maintainability) and **game developer** (can this express the games we want, and does it feel good to play and author?).

Severity: 🔴 fix before building on it · 🟠 fix within MVP · 🟢 fine / minor.

---

## 1. Inventory

### Shared models (`shared/src/models`)

| Model | Fields (abridged) | Notes |
|---|---|---|
| `User` | `userId` (Discord), `username`, `globalName`, `avatarUrl`, `servers[]` | Global identity |
| `Server` | `serverId`, `adminRoleIds`, `modRoleIds`, `prefixes`, `discovery{}`, `playerList[]`, `regions[]` | Guild config |
| `Region` | `name`, `baseGeneration`, `charactersPerPlayer`, `characterList[]`, `currencyType`, `deployable`, `deployed`, `graphicSettings{}`, `locations[]`, `pokedex[]` (slots w/ forms), `progressionDefinitions` (Map), `quests{active[],passive[],maxPassiveQuests}`, `shops[]`, `transportationTypes[]` | The "game" |
| `Location` | `name`, `regionId`, `requirements`, `connections[{toLocationId, requirements}]`, `trainerIds[]`, `wildTables[]`, `ordinal` | Graph node |
| `DexEntry` | Showdown species fields + `sprites`, `catchRate`, `expYield`, `evYields`, `isCanon`, `isPublic`, `originServer`, ref-ified `evos/prevo/formes` | Global species catalog |
| `requirement.ts` (embedded) | `progressions` (record), `items[]`, `capabilities[]` | Shared primitive |
| `progressionDefinition.ts` (embedded) | `kind` (`numeric`/`milestone`/`boolean`), `name`, `description`, `visibility`, `min/max`, `sequential`, `milestones[]` | |
| `wildTable.ts` (embedded) | `encounterType` enum, `timeBlocks[{timeOfDay, slots[{speciesId,min,max,weight}]}]` | |

DTOs exist for User, Server, Region. There are no DTOs for Location or DexEntry. tRPC routers: `users`, `servers`, `regions` (read-only).

### Bot commands (`apps/bot`, guild-scoped to dev guild `1010726453974925402`)

| Command | Status | What it does |
|---|---|---|
| `/server` (+ prefixes, roles) | ✅ Working | Admin/mod roles, prefixes |
| `/discovery` (+ description) | ✅ Working | Discovery listing settings |
| `/regions` | ✅ Working | List regions and create one by name |
| `/region` | ✅ Partial | Hub with Deploy toggle + 9 submenus. Working: **Pokedex, Progression, Locations**. Placeholders: Moves, Transportation, Quests, Shops, Mechanics, Graphics |
| `/managepokedex`, `editpokedexslot`, `swap`, `customize` | ✅ Working | Slot species, swap, forms |
| `/progressions`, `progressionEdit`, `milestones` | ✅ Working | CRUD for all three kinds + milestones |
| `/locations`, `/location` | ✅ Partial | Create, rename, delete. Connections, Entry Rules, Trainers, and Wild Pokémon are "coming soon" |

No player-facing commands exist yet. Automated tests are e2e scaffolds only, with no unit tests on models or logic.

### Showdown fork (`nbely/pokemon-showdown`)

- Forked from upstream at **Aug 2023** (~3 years behind upstream as of this audit).
- Custom changes:
  - "New Logora" fakemon written **directly into base `data/pokedex.ts`, `learnsets.ts`, `moves.ts`** (replacing CAP).
  - An `updatePlayerState` stream command that injects HP/status.
  - `secondaryChanceCallback` on moves.
  - Sim exports and example scripts.
- Nothing in `pokesandbox` imports it yet.

---

## 2. Findings

### Architecture

| Sev | Finding | Where | Why it matters | Concept doc |
|---|---|---|---|---|
| 🔴 | **Runtime and authoring share the same live documents.** `deployed` is a flag on the same Region/Location docs admins are editing, and `deployable` is a stored boolean rather than a computed validation result. | `region.model.ts`, `region.ts` Deploy button | Once players exist, every admin edit (rename, delete a location, delete a progression) lands mid-session for live players. Deleting a node players stand on, or a progression key they hold, corrupts saves. | [01](concepts/01-content-vs-state-and-publishing.md) |
| 🔴 | **The cache returns shared, mutable Mongoose documents** (`useClones: false`), and handlers mutate them and then `save()`. | `node-cache.adapter.ts`, all `cached*.ts` | Two concurrent sessions hold the *same object*. One session's half-finished mutation can be persisted by another session's `save()`, and TTL eviction splits identity. Tolerable for one admin. Dangerous for player state (double-spend, item dupes). | [15](concepts/15-persistence-concurrency-and-runtime.md) |
| 🔴 | **No game-engine layer.** Business logic lives in Discord menu handlers (e.g. region creation defaults inside `regions.ts`, location deletion inside `location.ts`). | `apps/bot/.../slashCommands` | Gameplay rules (travel, battle, effects) can't live in Discord handlers if the webapp, tests, AI, and future clients need them. | [03](concepts/03-engine-boundary-and-game-loop.md) |
| 🟠 | **Bidirectional reference arrays.** `Region.locations[]` duplicates `Location.regionId`. `Server.regions[]` has no matching `Region.serverId`. `Server.playerList[]` duplicates `User.servers[]`. `Region.characterList[]` is unbounded. | models | Two sources of truth drift (location delete already updates both in two non-atomic writes). Unbounded arrays grow large. | [02](concepts/02-identity-and-references.md) |
| 🟠 | **No indexes / unique constraints** (`serverId`, `userId`, `Location.regionId`). | all models | `ensureServerInitialized` can double-create a Server on concurrent first use. Lookups by region do collection scans. | [15](concepts/15-persistence-concurrency-and-runtime.md) |
| 🟠 | **Content is referenced by ObjectId** (`speciesId`, `itemId`, `toLocationId`). | `wildTable.ts`, `requirement.ts` | ObjectIds aren't portable. Region templates, import/export, cloning, and re-seeding all need ID remapping. Showdown keys everything by string ID (`bulbasaur`, `potion`). | [02](concepts/02-identity-and-references.md), [12](concepts/12-content-catalog-species-moves-items.md) |
| 🟠 | **No referential integrity on delete.** Deleting a location leaves inbound `connections` dangling. Deleting a progression leaves requirements referencing its key. | `location.ts`, `progressionEdit.ts` | Silent soft-locks in shipped regions. | [16](concepts/16-authoring-validation-and-portability.md) |
| 🟠 | **Placeholder fields bake in premature structure.** `quests.active/passive` arrays, `transportationTypes: string[]`, `shops[]`, `currencyType: string`, `trainerIds` on Location. | `region.model.ts`, `location.model.ts` | These encode decisions the roadmap has since moved past (e.g. quest type is a property of the quest). Remove them before they get data. | various |
| 🟠 | `itemRequirement.itemId` refs an `Item` model that doesn't exist. | `requirement.ts` | No item catalog exists yet (now planned as `ItemDefinition` in the DB catalog). | [12](concepts/12-content-catalog-species-moves-items.md) |
| 🟢 | Commands are registered per-guild under a hardcoded dev guild folder. | `interactions/guilds/1010726453974925402` | Fine for dev. A public bot needs global registration plus per-guild enablement. | [03](concepts/03-engine-boundary-and-game-loop.md) |
| 🟢 | Zod-first models, DTO boundary, tRPC-only webapp, `PopulatedQuery` typing, and the cache-first helper pattern. | — | Solid conventions. Keep them. | — |

### Game design

| Sev | Finding | Why it matters | Concept doc |
|---|---|---|---|
| 🔴 | **Requirements are AND-only buckets.** You can't express "Badge 3 **or** the Silph Scope flag", "**not** yet defeated Rival", "time is night", "has visited target", or "chose Bulbasaur". | Pokémon gating is full of OR/NOT/choice logic (rival variants, branching events, post-game). This shape gets rebuilt the moment quests arrive. | [05](concepts/05-requirements.md) |
| 🔴 | **No interaction/event model.** Your roadmap lists triggers, NPC talk/defeat effects, pick-1 gifts, gauntlets, forced battles, and onboarding as separate features. The original plan modeled each with bespoke fields. | These are all the same thing: *a conditional, ordered sequence of dialogue, choices, battles, and effects*. Building them separately creates 5+ runtimes, and Quest v2 forces a rewrite. | [07](concepts/07-scripts-triggers-and-events.md) |
| 🔴 | **Showdown has no overworld mechanics.** Catching, running, in-battle bag items (Potion, Poké Ball), EXP, level-up, move learning, and evolution all live outside the simulator. The fork only adds HP injection. | Wild battles (the core MVP loop) need sim-level hooks for item use, catching, and running. Pre-MVP PvP doesn't, which is a good reason to sequence PvP first. | [14](concepts/14-battle-system-and-showdown.md) |
| 🟠 | **Journey and Pokémon instance models don't exist.** | Every player feature depends on them. Their shape (embedded vs separate collection) decides whether trading, GTS, breeding pools, and PvP-with-adventure-party are cheap or a migration. | [13](concepts/13-pokemon-instances-and-trading.md) |
| 🟠 | **No "rules" profile.** `baseGeneration: 10` is a magic default. EXP formula, catch formula, mechanics generation, time model, whiteout penalty, and party/box limits are all undefined. | "Recreate RBY" vs "any modern game" depends on per-region rules, not hardcoded engine choices. | [18](concepts/18-rules-time-and-randomness.md) |
| 🟠 | **Wild encounter methods are a hardcoded enum** (and include `gift`, which isn't a wild method). There's no encounter rate, and slots can't carry conditions (post-game, swarms, flags). | Gen 2+ games need headbutt, Rock Smash, swarms, radio, weather. | [10](concepts/10-encounters.md) |
| 🟢 | The progression system (kinds, visibility, generated keys, sequential milestones) is well designed. | Needs `choice` and an engine-managed flag namespace. | [04](concepts/04-progression-and-flags.md) |
| 🟢 | Directional edges with location- and edge-level gates are the right region map model. | Add node kinds, grouping, and services (heal/PC/shop). | [08](concepts/08-region-map-and-locations.md) |

---

## 3. What to keep and what to change

**Keep:**
- Zod-first models and the DTO boundary.
- Embedded definitions on Region.
- The directional graph.
- Discriminated unions with `kind`.
- Generated hidden keys.
- The `visibility` enum.
- FlowCord menus for authoring.

**Change before MVP content exists (cheap now, expensive later):**
1. Requirements become a composable **Condition** tree with a predicate registry.
2. Add a single **Script** system (trigger → condition → steps) instead of bespoke trigger/gauntlet/gift/NPC-dialogue features.
3. Add a **draft → published release** split for region content. Runtime reads immutable releases.
4. Use **string content keys** (Showdown IDs for canon content, opaque region-scoped keys for authored content) instead of cross-content ObjectIds.
5. Create a **`libs/engine`** package: a pure domain layer (actions in, events out) that the bot and webapp both call.
6. Pokémon instances get **their own collection**. Journey stays a compact save-state document.
7. Slim the Showdown fork to a **thin patch set**, rebased on current upstream, with custom content injected into isolated dexes.

Each is detailed, with alternatives and pros/cons, in the concept docs.
