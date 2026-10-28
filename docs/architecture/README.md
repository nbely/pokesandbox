# PokeSandbox Architecture

An audit of the current models and commands, plus concept-by-concept proposals for an engine that can scale from "recreate Red/Blue" to "any modern Pokémon game" without a rebuild.

**Start here:**
1. [`audit-current-state.md`](audit-current-state.md): what exists today and what's risky.
2. The **big alternates** below.
3. [`open-questions.md`](open-questions.md): decisions needed from the owner.
4. [`decision-log.md`](decision-log.md): what was already decided in the ChatGPT sessions (with the transcript in `reference/`).

> **Status (Oct 2026):** all 33 open questions are answered. Decisions are recorded in [`open-questions.md`](open-questions.md) and in each concept doc's "Decisions" section, and they supersede the original proposals where they differ.

## The big alternates (vs. the current plan)

| # | Current plan / code | Proposed | Why | Doc |
|---|---|---|---|---|
| 1 | `deployed` flag on live-edited docs | **Draft → immutable published releases**; characters pin a release version | Admin edits can't corrupt live saves. Immutable content is trivially cacheable. Rollback, changelogs, templates, and export come for free. | [01](concepts/01-content-vs-state-and-publishing.md) |
| 2 | Bespoke features: triggers, NPC talk/defeat effects, pick-1 gifts, gauntlets, onboarding, rival encounters | **One Script system**: trigger → condition → steps (`say`, `choice`, `battle`, `effects`, `if`…), persisted cursor, templates on top | This is how real Pokémon games are built. One runtime instead of 5–7. Quest v2 becomes additive instead of a rebuild. | [07](concepts/07-scripts-triggers-and-events.md) |
| 3 | Requirements = AND-only buckets (`progressions`, `items`, `capabilities`) | **Condition tree** (`all/any/not`) + predicate registry (evaluate/explain/validate/references) | OR/NOT/choice/time/visited are everywhere in Pokémon gating. "Why is this locked" UX. Feeds the soft-lock validator. | [05](concepts/05-requirements.md) |
| 4 | Logic inside Discord menu handlers | **`libs/engine`**: actions in, events out, per-character lock, persisted "mode" (overworld/script/battle) | Restart-safe, testable headless, shareable with the webapp/AI, no double-click dupes | [03](concepts/03-engine-boundary-and-game-loop.md) |
| 5 | ObjectId cross-references for content (`speciesId`, `itemId`, `toLocationId`) and bidirectional arrays | **Showdown IDs** for canon content, **content keys** for authored content, one-directional ownership | Portability (templates, import/export), zero translation on the battle hot path, no drift | [02](concepts/02-identity-and-references.md) |
| 6 | Fork with custom data in base files, 3 years stale, HP injection only | **Rebased fork + thin patch set** (state injection, external choice hook for bag/catch/run) + content as **mods**; BattleService with persistence/recovery and AI profiles | Showdown has no catching/running/bag. Upstream fixes keep flowing. Custom fakemon path proven early. | [14](concepts/14-battle-system-and-showdown.md) |
| 7 | (Unbuilt) Character holding party/boxes | **PokemonInstance collection** with `storage` union, in Showdown set shape; TeamPresets for the Arena | Trading, GTS, breeding pools, and adventure PvP become queries, not migrations | [13](concepts/13-characters-and-pokemon-instances.md) |
| 8 | Boolean progressions for every event | **Engine-managed flags** (trainer defeated, script done, item picked up) separate from curated progressions; add `choice` kind | Real games have thousands of flags. Admins shouldn't define each. | [04](concepts/04-progression-and-flags.md) |
| 9 | `baseGeneration` + scattered defaults | **`RegionRules`** with presets (Classic Gen 1, Modern) + injected Clock/Rng | "Recreate RBY" and "modern game" become the same engine with different rules | [18](concepts/18-rules-time-and-randomness.md) |
| 10 | Shared mutable cached Mongoose docs, no indexes, no transactions | Cache immutable data only; per-character lock + OCC; replica-set transactions; unique indexes | Prevents dupes and lost progress once players exist | [15](concepts/15-persistence-caching-concurrency.md) |

## Concept index

| # | Concept | MVP impact |
|---|---|---|
| 01 | [Content vs State & Publishing](concepts/01-content-vs-state-and-publishing.md) | High |
| 02 | [Identity & References](concepts/02-identity-and-references.md) | High |
| 03 | [Engine Boundary & Game Loop](concepts/03-engine-boundary-and-game-loop.md) | Very high |
| 04 | [Progression & Flags](concepts/04-progression-and-flags.md) | Medium |
| 05 | [Requirements → Conditions](concepts/05-requirements.md) | Very high |
| 06 | [Effects](concepts/06-effects.md) | High |
| 07 | [Scripts, Triggers & Events](concepts/07-scripts-triggers-and-events.md) | Very high |
| 08 | [World Graph & Locations](concepts/08-world-graph-locations.md) | High |
| 09 | [Transportation Networks](concepts/09-transportation.md) | Medium |
| 10 | [Wild Encounters](concepts/10-encounters.md) | High |
| 11 | [NPCs, Trainers & Battle Definitions](concepts/11-npcs-trainers-and-battle-definitions.md) | High |
| 12 | [Content Catalog: Species, Moves, Items, TMs](concepts/12-content-catalog-species-moves-items.md) | High |
| 13 | [Characters & Pokémon Instances](concepts/13-characters-and-pokemon-instances.md) | Very high |
| 14 | [Battle System & the Showdown Fork](concepts/14-battle-system-and-showdown.md) | Very high |
| 15 | [Persistence, Caching & Concurrency](concepts/15-persistence-caching-concurrency.md) | High |
| 16 | [Authoring, Validation & Portability](concepts/16-authoring-validation-and-portability.md) | High |
| 17 | [Economy, Shops & Inventory](concepts/17-economy-shops-inventory.md) | Medium |
| 18 | [Region Rules, Time & Randomness](concepts/18-rules-time-and-randomness.md) | High |
| 19 | [Multiplayer, Social & Future-Proofing](concepts/19-multiplayer-social-and-future-proofing.md) | Low now, high later |
| 20 | [Database & Realtime Platform (MongoDB vs SpacetimeDB vs alternatives)](concepts/20-database-and-realtime-platform.md) | Medium |
| 21 | [Hosting & Environments](concepts/21-hosting-and-environments.md) | High (M0a) |
| 22 | [Adventure Log & Narration](concepts/22-adventure-log-and-narration.md) | Medium (log from MVP; narration later) |

Each concept doc follows the same outline: **TL;DR → current shape → gaps → options (pros/cons) → recommendation → MVP scope → open questions.** Follow-on sessions can take one concept at a time and turn it into a Decision issue plus model/schema specs.
