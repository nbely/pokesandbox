# PokeSandbox Roadmap

The full product roadmap from foundations to "Pie in the Sky". It's based on the owner's roadmap draft (Oct 2026), restructured around the architecture recommendations in [`../architecture/`](../architecture/README.md). The detailed MVP breakdown is in [`mvp.md`](mvp.md). The GitHub org and project setup is in [`github-project-setup.md`](github-project-setup.md).

## Phase overview

```
Phase 0  Foundations ─────────┐   engine package, conditions/effects, content keys, rules, infra
                              ▼
Phase 1  Pre-MVP: Arena ──────┤   catalog, team presets, BattleService, multi-user battles, AI   ► PUBLIC RELEASE #1
                              ▼
Phase 2  MVP: "Recreate RBY" ─┤   authoring (world, NPCs, scripts, publish) + adventure play       ► PUBLIC RELEASE #2
                              ▼
Phase 3  Full-Feature Build ──┤   quests v2, custom content, trading, breeding, events, webapp
                              ▼
Phase 4  Pie in the Sky           co-op, RP adjudication, AI enrichments, dynamic custom moves
```

The ordering principle: **build each primitive once, at the earliest phase that needs it, in its final shape.** Phase 1 is deliberately the battle and Pokémon-data foundation that Phase 2 reuses. Phase 0 is small but non-negotiable: everything after it builds on the engine boundary.

---

## Phase 0: Foundations (pre-Arena)

**Goal:** Make the codebase ready to hold game rules, so nothing in Phase 1–2 gets built in a shape that must be rebuilt.

| Area | Deliverable | Concept |
|---|---|---|
| Engine | `libs/engine` package skeleton: `dispatch(action) → events`, per-character lock, injected Clock/Rng, in-memory test harness | [03](../architecture/concepts/03-engine-boundary-and-game-loop.md), [18](../architecture/concepts/18-rules-time-and-randomness.md) |
| Primitives | Condition tree + predicate registry (evaluate/explain/validate/references); Effect union + executor (atomic, idempotent) | [05](../architecture/concepts/05-requirements.md), [06](../architecture/concepts/06-effects.md) |
| Identity | ContentKey type, Showdown-ID references, remove bidirectional arrays, indexes | [02](../architecture/concepts/02-identity-and-references.md) |
| Persistence | Mongo replica set (transactions), cache policy (immutable only), OCC helpers | [15](../architecture/concepts/15-persistence-caching-concurrency.md) |
| Showdown | Rebase fork onto upstream; archive the 10 New Logora custom moves off `master` (Q28); patch set (state injection, external choice hook, caught/ran endings, isolated custom-data dexes); publish as a package the monorepo consumes | [14](../architecture/concepts/14-battle-system-and-showdown.md) |
| Org | Move repos to the org, CI (lint, typecheck, unit tests), labels/project/milestones, global command registration | [github-project-setup](github-project-setup.md) |

Hosting and production operations are **not** Phase 0. They're the launch-readiness step at the end of Phase 1.

**Exit criteria:** an engine unit test can evaluate a condition tree and apply an effect list to an in-memory character. The fork builds from upstream plus patches, with a passing sim test for HP injection.

---

## Phase 1: Pre-MVP "Arena" (public release #1)

**Goal:** Showdown-style battles between two server members (and vs AI) with teams validated against server-scoped Arena formats (canon and/or the server's custom content library). Battles run publicly, button-driven, independent of adventure state. This ships the hardest subsystem first and gets real users early.

| Area | Deliverable |
|---|---|
| Catalog | Showdown dex as battle truth; DexEntry `speciesId`; ItemDefinition (battle-relevant subset) |
| Formats | `ArenaFormat` (server-scoped: species pool from canon / server library / optional region dex, bans, rules); built-in canon formats so the Arena works on a fresh server; `RegionRules` presets for adventure |
| Teams | `TeamPreset` model; Showdown paste import/export; guided builder; TeamValidator against the format |
| Battles | `BattleService` (start/choose/events/persist/recover); Discord renderer (public turn message + ephemeral choice prompts); timers; forfeits; spectating |
| Multi-user | Challenge → accept → battle on BattleService-driven shared surfaces (plain discord.js handlers with stable IDs). FlowCord stays single-user for the `/arena` hub. Moving them onto FlowCord multi-user sessions is a later option, not a dependency. See [14 § Multiplayer boundary](../architecture/concepts/14-battle-system-and-showdown.md#multiplayer-boundary-with-flowcord-decided-oct-2026-q34) (Q34) |
| AI | AI profiles `random`, `basic`, `smart`; PvAI with "AI picks team" or "random by tier" |
| Ops | **Launch readiness:** hosting, Atlas + backups, deploy pipeline, monitoring, staging (the last step before going public). Battle history persistence. |

**Exit criteria:**
- Two users on a public test server can build teams by paste, challenge, battle to completion with spectators, and survive a bot restart mid-battle.
- PvAI works at two difficulty levels.

---

## Phase 2: MVP "Recreate Red/Blue/Yellow" (public release #2)

**Goal:** An admin can build a complete Kanto (Pallet → Champion) using only PokeSandbox tools, publish it, and players can play it start to finish.

### Region building (admin)
- Region config: name, currency, rules preset, starting location, respawn default.
- Regional pokedex (exists) + TM/HM list + learnset policy.
- Locations: kinds, grouping, directional edges with conditions, services, two-way toggle.
- Progression definitions (exists) + `choice` kind. Engine-managed flags.
- Wild encounters: method registry, conditioned tables.
- NPCs and Trainers: trainer classes, conditioned party variants (rival keyed off `starterChoice`), AI profiles, rewards, engagement modes.
- **Scripts & Triggers** (one system): dialogue, choices, battles, effects, branches. Templates for Gym Leader, Starter/Pick-N Gift, Forced Encounter, Gift NPC, Gauntlet (Elite 4), Simple Talker.
- Effects (primitive): items, money, Pokémon gifts, progression/milestone/choice/flag, heal, respawn.
- Transportation networks: Fly and Ferry templates.
- Shops: conditioned entries, buy/sell.
- **Publish:** validator (Region Health) → immutable release. Undeploy/pause.
- Region export/import (JSON bundle) → "Kanto Classic" template.

### Playing
- Character creation (1 per region), onboarding via a `characterCreated` script, starter pick, rival setup.
- `/play` hub: location view, travel (with locked-edge explanations), Fly/transport.
- Explore: wild encounters by method/time; Repel.
- Battles: fight, switch, **bag items, catch, run** (needs the patch set's external choice hook); trainer battles; rival; gyms; Elite 4 gauntlet; whiteout → respawn.
- EXP, level-ups, move learning, evolution (level/stone/trade-substitute).
- Party (reorder, summary), PC boxes (deposit/withdraw/release, overflow), bag (pockets, use/give/take).
- Shops, money from battles, heal at centers.
- Profile: badges/milestones, visited locations, dex seen/caught.

**Exit criteria:**
- The "Kanto Classic" template publishes with zero validator errors.
- A playtester completes Pallet → Champion.
- The engine test suite runs a scripted bot through the first two gyms headlessly.

---

## Phase 3: Full-Feature Build

| Theme | Items | Builds on |
|---|---|---|
| Quests v2 | Active quests (scripts + quest log), passive objectives (event listeners), loaner Pokémon, quiz stages, repeatable quests, passive-slot limits, tutorial-as-quest | Script VM, engine events |
| Narrative | Persistent dialogue choices (choice kind is already MVP), quest-local choices as script locals | Conditions, scripts |
| Effects++ | Teleport, start-script, new attach points (transport hops, quest stages) | Effect registry |
| Custom content | Server content library (fakemon/forms/types/moves/items reusable across a server's regions) injected into isolated Showdown dexes | Catalog layering, isolated custom-data dexes |
| Social | In-game PvP with adventure parties; trading; Wonder Trade; GTS-style listings | PokemonInstance collection, BattleService |
| Breeding | Contained service + server pool; eggs; hatching | `storage.kind` |
| Happiness | Friendship evolutions, move unlocks | PokemonInstance.friendship |
| Rematches | Trainer/gym rematch variants (VS Seeker / phone) | Conditioned parties, `timer` kind |
| Server events | Server-wide events, giveaways, event quests, plot-NPC chance encounters, forced-loss/survival battles | WorldState, `chance` predicate, battle win-conditions |
| Community boss | Shared HP pool raid | State injection hook + WorldState |
| World | Weather/terrain by location, swarms, visible-spawn UI | Encounter conditions |
| Staff ops | Grant items/Pokémon/money/TMs with audit log | Effect executor |
| Webapp | Character sheet, party viewer, battle replays, activity log; builder for graphs/scripts | Event log, battle logs, region bundles |

## Phase 4: Pie in the Sky

| Item | Key prerequisite already in place |
|---|---|
| Co-op (raids, 2-player doubles, co-op story) | `participants[]` on mode records; Showdown multi battles; 4+ players needs fork surgery |
| Energy/pacing toggle | Action cost hook in `dispatch` |
| Cross-region / cross-server travel | Character keyed by (user, region); portable Pokémon instances |
| Player-editable RP prose on travel logs | Event log |
| Webapp as a full play surface | `libs/engine` |
| Minigames at locations | Script steps / custom step types |
| Custom moves/abilities/items via strict templates | Inherit an existing move's mechanics + overrides, loaded like dex data (Q28) |
| RP quests + pluggable adjudication (mod queue / AI judge; participant vs approver roles) | Script `await: approval` step |
| AI enrichments (BYO key): narrative responses, battle commentary, NPC personalities, bonding sessions | Event renderers + optional narrator decorator |

---

## Cross-cutting tracks (run alongside every phase)
- **Docs & onboarding:** admin guides per builder menu, template walkthroughs, player help.
- **Quality:** engine unit tests per predicate/effect/step; validator tests; Showdown patch tests; e2e smoke on a test guild.
- **Observability:** structured logs keyed by `characterId`/`battleId`/`actionId`; error reporting; basic metrics (active players, battles/hour).
- **Community:** alpha server, feedback channels, release notes generated from region and bot releases.
