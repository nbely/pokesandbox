# MVP Roadmap: Pre-MVP Arena → "Recreate Red/Blue/Yellow"

This doc breaks Phases 0–2 of [`roadmap.md`](roadmap.md) into **GitHub milestones → epics → candidate issues**, plus a gap matrix against the owner's MVP feature list. Issue titles are written so they can be pasted directly into issues. Sizes: S (≤1 day), M (2–4 days), L (1–2 weeks), XL (split further).

> Sequencing assumes the recommendations in [`../architecture/open-questions.md`](../architecture/open-questions.md) Q15–Q22 are accepted. If one is rejected, the affected epics are marked with its Q-number.

## Milestones at a glance

| # | Milestone | Outcome | Depends on |
|---|---|---|---|
| M0 | **Foundations** | Engine package, primitives, identity/persistence fixes, org/CI | — |
| M1 | **Battle Core & Catalog** | BattleService + slim Showdown fork + catalog + team presets | M0 |
| M2 | **Arena Release (Pre-MVP)** 🚀 | Public PvP/PvAI in Discord | M1 |
| M3 | **World Authoring** | Locations, encounters, transport, shops, rules, publish/validate | M0 (parallel with M1/M2) |
| M4 | **Interaction Engine** | Scripts, triggers, NPCs, trainers, templates | M0, M3 |
| M5 | **Adventure Core** | Character, travel, explore, wild/trainer battles, party/PC/bag, progression | M1, M3, M4 |
| M6 | **Kanto Classic & MVP Release** 🚀 | Kanto built with the tools, playtested, released | M5 |

```
M0 ──► M1 ──► M2 🚀
  └──► M3 ──► M4 ──► M5 ──► M6 🚀
         (M1 also feeds M5)
```

Two people can run M1→M2 (battle track) and M3→M4 (authoring track) in parallel after M0.

### Proposed re-sequencing: Arena critical path (Oct 2026, after Q29)
With ~1 senior full-time-ish, possibly a second senior, 2 junior-to-mid devs, and every PR reviewed by the owner, M0 as written is too big to sit in front of the Arena. **The Arena doesn't need most of M0.** It needs no conditions/effects, scripts, content keys, releases, or authoring layer. Proposal: split M0.

| # | Milestone | Contents | Blocks |
|---|---|---|---|
| **M0a** | **Platform & Arena Foundations** | Org move, CI, **hosting + prod environment** (Q30), Mongo replica set, indexes, cache policy, `libs/engine` skeleton (dispatch, lock, Clock/Rng, test harness), `libs/core` skeleton | M1, M2 |
| **M0b** | **Content Foundations** | Conditions + effects, content keys + model cleanup, `libs/authoring`, region releases/publish, progression `choice` kind, flags | M3, M4, M5 |

```
M0a ──► M1 ──► M2 🚀 (Arena)
  └──► M0b ──► M3 ──► M4 ──► M5 ──► M6 🚀 (MVP)
```
- The battle track (M0a → M1 → M2) and the content track (M0b → M3…) can run in parallel. Seniors own the foundation-heavy work (engine, fork rebase/patches, BattleService, conditions/effects). Juniors take well-specified issues: catalog seed data, item definitions, renderers, builder menus, webapp editors, tests.
- **Timeline honesty:** an end-of-year Arena (~9 weeks from late Oct) would need M0a + M1 + M2 done with this team while also standing up hosting/CI. That's possible only if the Arena scope stays tight: paste import, built-in formats, `basic` AI, timers, restart recovery. Plan for **end of year as a stretch, Q1 as realistic**, and re-estimate once M0a's issues are sized.

---

## Gap matrix (owner's MVP list → status → milestone)

Legend: ✅ exists · 🟡 partial · ❌ missing

### Pre-MVP Arena
| Feature | Status | Milestone |
|---|---|---|
| Build teams for server-scoped Arena formats | ❌ | M1 |
| Showdown battles between two members, button-driven | ❌ | M1/M2 |
| Public channel battles / spectating | ❌ | M2 |
| Player vs AI (pick AI team or random by tier) | ❌ | M2 |

### Region building (admin)
| Feature | Status | Milestone | Notes |
|---|---|---|---|
| Create/configure region: name | ✅ | — | |
| Currency, starters, starting location | 🟡 (`currencyType` only) | M3/M4 | Starter = pick-1 gift script |
| Regional pokedex | ✅ | — | Switch refs to species IDs (M0) |
| Locations: create | ✅ | — | |
| Locations: connect (directional) / gate | 🟡 (schema only, builder "coming soon") | M3 | Conditions replace requirements |
| Wild encounter tables | 🟡 (schema only) | M3 | Method registry, conditions |
| Trainers/NPCs (dialogue, rewards, placement, gym-leader tier) | ❌ | M4 | |
| NPC party variants by progression | ❌ | M4 | Conditioned parties |
| Conditional triggers (forced dialogue/battles/effects, once/repeatable) | ❌ | M4 | Script system |
| Effects primitive | ❌ | M0 | |
| Pick-1 gift rewards | ❌ | M4 | Script template |
| Battle gauntlets (Elite 4) | ❌ | M4 | Script template |
| Transportation networks (Fly, ferry…) | ❌ (`transportationTypes: string[]`) | M3 | |
| Shops | ❌ | M3 | |
| TM/HM list | ❌ | M3 | |
| Progression definitions (milestone/numeric/boolean) | ✅ | — | |
| Progression `choice` kind | ❌ | M0 | |
| Deploy/undeploy with playability validation | 🟡 (toggle only, `deployable` never computed) | M3 | Publish → release |

### Playing
| Feature | Status | Milestone |
|---|---|---|
| Create character (1/region), onboarding, starter, rival setup | ❌ | M5 (+M4 scripts) |
| Travel graph with gating; map/current location | ❌ | M5 |
| Fly / transport | ❌ | M5 |
| Wild encounters (random, fishing, time) | ❌ | M5 |
| Battles: fight/switch | ❌ | M1 |
| Battles: run, bag items, catch | ❌ | M1 (sim hook) + M5 |
| Trainer battles, rival, gyms, Elite 4 | ❌ | M5 |
| EXP, level-ups, moves, evolution | ❌ | M5 |
| Party management, summaries | ❌ | M5 |
| PC boxes | ❌ | M5 |
| Inventory/bag | ❌ | M5 |
| Shops buy/sell; money from battles | ❌ | M5 |
| Heal at centers; respawn on whiteout | ❌ | M5 |
| Profile/character view | ❌ | M5 |
| Progression tracking (badges, visited) | ❌ | M5 |

---

## M0: Foundations

**Epic: Org & Delivery Setup**
- [ ] Move `pokesandbox` and `pokemon-showdown` to the org; update README links, CODEOWNERS, agents.md (S)
- [ ] CI: lint + typecheck + unit tests on PR (M)
- [ ] Create labels, issue types, milestones, and project board per [`github-project-setup.md`](github-project-setup.md) (S)
- [ ] Switch slash commands to global registration with per-server feature gating (M)

**Epic: Engine Package** (Q18)
- [ ] Scaffold `libs/engine` (pure TS, no discord.js) with repository and ContentProvider interfaces (M)
- [ ] `dispatch(characterId, action)` with per-character lock, action/event types, and error model (M)
- [ ] Injected `Clock` and seeded `Rng` (S)
- [ ] In-memory test harness (fixtures from region bundles) (M)
- [ ] Scaffold `libs/core` (content schemas, registries, validator home) and `libs/authoring` (`execute(actor, command)`, per-entity OCC, role checks, `ContentChange` output) (M)
- [ ] Migrate existing admin menus (pokedex, progression, locations) onto `libs/authoring` commands (M)

**Epic: Conditions & Effects** (Q17)
- [ ] Condition tree schema (`all/any/not`) + predicate registry API (M)
- [ ] MVP predicates: progression, milestone, choice, flag, item, currency, party, visited (`$target`), time (L)
- [ ] Condition explainer ("Requires …") and validator hooks (M)
- [ ] Effect union + registry + atomic executor with idempotency (L)
- [ ] MVP effects: currency, item, givePokemon, progression, milestone, choice, flag, heal, setRespawn, random (L)

**Epic: Model Cleanup & Identity** (Q19, Q21)
- [ ] ContentKey type + generator. Add `key` to Location (S)
- [ ] Reference species/items by Showdown ID. Add `speciesId` to DexEntry (M)
- [ ] Remove `Region.locations/characterList/shops/quests/transportationTypes` and `Server.playerList`. Add `Region.serverId` (M)
- [ ] Progression `choice` kind (+ builder) (M)
- [ ] Engine-managed flag namespace conventions (S)
- [ ] Indexes and unique constraints across models (S)

**Epic: Persistence & Caching**
- [ ] docker-compose Mongo as a replica set (transactions) (S)
- [ ] Cache policy: stop caching hydrated mutable docs. Use atomic `$set` for admin edits (M)
- [ ] Inbound-edge cleanup and "used by" guard on deletes (M)

## M1: Battle Core & Catalog

**Epic: Showdown Fork Modernization** (Q20, decided)
- [ ] Preserve the 10 custom moves on an archive branch. Remove them from `master` and restore the 3 commented-out upstream tests (S)
- [ ] Rebase onto current upstream (fallback: fresh from upstream + re-apply kept patches as new commits) (M)
- [ ] Patch: generalized state injection (any side; HP/status/PP) with sim tests (M)
- [ ] Patch: external choice hook (bag/catch/run consume turn) + `caught`/`ran` end reasons (L)
- [ ] Patch: isolated custom-data dexes (per content hash) for `Battle` + `TeamValidator`, evolved from `dynamic-dex-data` (L)
- [ ] Remove debug code (`pause`/`resume`/`sendToJSON`) (S)
- [ ] Publish as a versioned package consumed by the monorepo. Set up the monthly upstream-sync PR. Rename to `pokesandbox-showdown` after the org move (M)

**Epic: Catalog**
- [ ] Catalog service over the Showdown Dex (species, moves, items, abilities, learnsets) (M)
- [ ] ItemDefinition model + Gen 1 item seed (pockets, prices, field/battle handlers) (L)
- [ ] Piecemeal `RegionRules` model (holistic battle mechanics gen + per-dimension data/formula/graphics choices + gimmick toggles) with compatibility validation (M)
- [ ] Gen 1 implementations for every dimension: Gen 1 mechanics (Showdown `gen1`), species stats, types, moves, learnsets, catch rates, EXP/catch/escape/payout formulas, original sprites, DVs/Stat Exp. "Classic Gen 1" preset (L)
- [ ] Assemble per-release data mixes from Showdown gen mods into isolated custom-data dexes (M)

**Epic: Teams**
- [ ] `PokemonSet` shared type and `TeamPreset` model (S)
- [ ] `ArenaFormat` model (server-scoped) + built-in canon formats → Showdown custom format + TeamValidator (M)
- [ ] Showdown paste import/export (M)
- [ ] Guided team builder (Components v2 + FlowCord submenu/pagination flows; reuse the Pokédex builder's Pokémon search flow; autocomplete for moves). Can follow the Arena launch (L)
- [ ] Random legal team for a format + per-Pokémon validation error messages (M)

**Epic: BattleService**
- [ ] BattleService start/choose/events API, in-process (L)
- [ ] Battle persistence (seed + input log) and recovery on boot (M)
- [ ] Protocol → GameEvent translation (M)
- [ ] Discord battle renderer (turn embed, HP bars, ephemeral choice prompts) (L)
- [ ] Turn timers and timeout policy (M)

**Epic: AI Players**
- [ ] AI player interface + `random` profile (S)
- [ ] `basic` profile using `@smogon/calc` (M)
- [ ] `smart` profile (switching, status, items) (L)

## M2: Arena Release 🚀
- [ ] FlowCord multi-user flows: challenge/accept/decline (L)
- [ ] `/arena` hub: teams, challenge member, battle AI (M)
- [ ] Public battle message + spectating (M)
- [ ] PvAI: "AI picks team" / "random by tier" (M)
- [ ] Battle history list (per user) (S)
- [ ] Alpha test on the community server; feedback triage (M)
- [ ] Release notes + admin/player docs (S)

## M3: World Authoring
- [ ] Region config menu: currency object, starting location, respawn, rules preset (M)
- [ ] Location kinds, grouping (`parentKey`), description/image, services, tags (M)
- [ ] Connections editor with two-way toggle and labels (M)
- [ ] Condition builder UI (flat "all of" + one nesting level + templates) (L)
- [ ] Encounter method registry + conditioned encounter tables + builder (L)
- [ ] TM/HM list + learnset policy menu (M)
- [ ] Transport networks + Fly/Ferry templates (M)
- [ ] Shops with conditioned entries (M)
- [ ] Validator Tier 1 + basic Tier 2 + "Region Health" view (L)
- [ ] Publish → RegionRelease (chunked) + ContentProvider + pause/undeploy (L)
- [ ] Region bundle export/import (JSON) (M)

**Epic: Webapp Authoring (Q24)** (can run in parallel with M3/M4 once the matching `libs/authoring` commands exist)
- [ ] Webapp authoring shell: Discord-role-checked access to a region's draft, entity-level conflict handling (M)
- [ ] Shared condition builder component (M)
- [ ] World graph canvas (locations, directional/two-way edges, grouping, gate badges) (L)
- [ ] Encounter table grid (M)
- [ ] Trainer party editor with conditioned variants (M)
- [ ] Script step editor (L)
- [ ] Region Health view (read-only) (S)
- [ ] Player profile + character pages with privacy settings (M)

## M4: Interaction Engine (Q16)
- [ ] Script + Trigger models (M)
- [ ] Script VM: steps `say/choice/if/effects/battle/wildBattle/heal/shop/travel/goto/end` (L)
- [ ] Mode machine + persisted script cursor + resume on input (M)
- [ ] Trigger dispatch: characterCreated, enterLocation, interact, battleEnd, explore; once/priority/forced (M)
- [ ] TrainerClass registry (canon seed) + Trainer with conditioned party variants (M)
- [ ] NPC model (location, visibility, interact, trainer, engagement) (M)
- [ ] Script step-list editor in Discord (L)
- [ ] Templates: Gym Leader, Starter/Pick-N Gift, Forced Encounter, Gift NPC, Gauntlet, Simple Talker (L)

## M5: Adventure Core
- [ ] Character + PokemonInstance models, OCC, transactions (M)
- [ ] Character creation + onboarding trigger + release-version migration rules (M)
- [ ] `/play` hub renderer (mode-aware) (L)
- [ ] Travel action (conditions, locked explanations, enter triggers, visited tracking) (M)
- [ ] Transport action (Fly menu) (S)
- [ ] Explore action: weighted outcome table (wild/trainer/hidden item), Repel safe steps, trainer engagement (M)
- [ ] Traversal requirements: location progress counters (lifetime/visit), one-time + permanent costs, compiled exit gates with explanations (M)
- [ ] Wild battles: catch formula, run odds, bag in battle (via hook) (L)
- [ ] Trainer battles: party variant selection, AI profile, payout, defeat flags, whiteout (M)
- [ ] Post-battle: EXP, level-up, move learn prompts, evolution (level/stone) (L)
- [ ] Party view/reorder/summary (M)
- [ ] PC boxes: deposit/withdraw/release, overflow (M)
- [ ] Bag: pockets, use/give/take outside battle (M)
- [ ] Shops buy/sell (S)
- [ ] Heal points + respawn (S)
- [ ] Profile: badge case, milestones, visited, dex (M)

## M6: Kanto Classic & MVP Release 🚀

**Kanto Classic adaptations (decided Oct 2026).** These keep MVP scope down without special mechanics:
- **No Safari Zone in MVP** (bait/rock/ball mechanics deferred). Its key rewards come another way, e.g. a Fuchsia NPC gift script gives HM03 Surf, and the Warden gives HM04 Strength directly or via a simpler fetch.
- **No unidentifiable-ghost mechanic.** Pokémon Tower's upper floors are gated on `bag.count silph-scope ≥ 1` (presentation `attemptable`, with a "the ghosts block your way" script). The rival battle stays reachable *outside* that gate (lobby/first floor), so story order matches RBY. The Marowak ghost is a scripted `wildBattle` behind the gate.

- [ ] Generator script: bulk Kanto data (locations, connections, encounters, trainers/parties, marts, TM list) → region bundle (L)
- [ ] Author Kanto Classic story/scripts/gates in the tools on the HQ server (dogfooding; track every builder friction as an issue) (XL → split per area)
- [ ] Canonical bundle in repo (`templates/kanto-classic/`), deterministic lossless export/import, CI validation + headless playthrough, deploy-time install (M)
- [ ] Headless engine playthrough test to badge 2 (M)
- [ ] Human playtest Pallet → Champion; balance pass (L)
- [ ] Load test: N concurrent players + battles on target hosting (M)
- [ ] Admin guide + player guide + template walkthrough (M)
- [ ] Public release + discovery listing (S)
