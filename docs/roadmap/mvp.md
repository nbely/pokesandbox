# MVP Roadmap: Pre-MVP Arena → "Recreate Red/Blue/Yellow"

This doc breaks Phases 0–2 of [`roadmap.md`](roadmap.md) into **GitHub milestones → epics → candidate issues**, plus a gap matrix against the owner's MVP feature list. Issue titles are written so they can be pasted directly into issues. Sizes: S (≤1 day), M (2–4 days), L (1–2 weeks), XL (split further).

> Sequencing follows the decisions in [`../architecture/open-questions.md`](../architecture/open-questions.md). Epics name the Q-numbers they implement.

## Milestones at a glance

| # | Milestone | Outcome | Depends on |
|---|---|---|---|
| M0a | **Platform & Arena Foundations** | Org/CI, library skeletons + boundaries, persistence basics, species IDs | — |
| M0b | **Content Foundations** | Conditions/effects/gates, content keys + model cleanup, authoring layer, releases | M0a |
| M1 | **Battle Core & Catalog** | BattleService + slim Showdown fork + catalog + team presets | M0a |
| M2 | **Arena Release (Pre-MVP)** 🚀 | Public PvP/PvAI in Discord; hosting & operations (launch readiness) | M1 |
| M3 | **Region Authoring** | Locations, encounters, transport, shops, rules, validate | M0b (parallel with M1/M2) |
| M4 | **Interaction Engine** | Scripts, triggers, NPCs, trainers, templates | M0b, M3 |
| M5 | **Adventure Core** | Journey, travel, explore, wild/trainer battles, party/PC/bag, progression | M1, M3, M4 |
| M6 | **Kanto Classic & MVP Release** 🚀 | Kanto built with the tools, playtested, released | M5 |

```
M0a ──► M1 ──► M2 🚀 (Arena)
  └──► M0b ──► M3 ──► M4 ──► M5 ──► M6 🚀 (MVP)
                (M1 also feeds M5)
```

The battle track (M0a → M1 → M2) and the content track (M0b → M3 → M4) run in parallel.

### Re-sequencing: Arena critical path (decided Oct 2026, after Q29)
With ~1 senior full-time-ish, possibly a second senior, 2 junior-to-mid devs, and every PR reviewed by the owner, M0 as written is too big to sit in front of the Arena. **The Arena doesn't need most of M0.** It needs no conditions/effects, scripts, content keys, releases, or authoring layer. Decision: split M0 into M0a and M0b, as in the table above.
- The battle track (M0a → M1 → M2) and the content track (M0b → M3…) can run in parallel. Seniors own the foundation-heavy work (engine, fork rebase/patches, BattleService, conditions/effects). Juniors take well-specified issues: catalog seed data, item definitions, renderers, builder menus, webapp editors, tests.
- **Timeline honesty:** an end-of-year Arena (~9 weeks from late Oct) would need M0a + M1 + M2 done with this team while also standing up hosting/CI. That's possible only if the Arena scope stays tight: paste import, built-in formats, `basic` AI, timers, restart recovery. Hosting and operations sit at the end of M2 (launch readiness), not in front of development. Plan for **end of year as a stretch, Q1 as realistic**, and re-estimate once M0a's issues are sized.

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
| Regional pokedex | ✅ | — | Switch refs to species IDs (M0a) |
| Locations: create | ✅ | — | |
| Locations: connect (directional) / gate | 🟡 (schema only, builder "coming soon") | M3 | Conditions replace requirements |
| Wild encounter tables | 🟡 (schema only) | M3 | Method registry, conditions |
| Trainers/NPCs (dialogue, rewards, placement, gym-leader tier) | ❌ | M4 | |
| NPC party variants by progression | ❌ | M4 | Conditioned parties |
| Conditional triggers (forced dialogue/battles/effects, once/repeatable) | ❌ | M4 | Script system |
| Effects primitive | ❌ | M0b | |
| Pick-1 gift rewards | ❌ | M4 | Script template |
| Battle gauntlets (Elite 4) | ❌ | M4 | Script template |
| Transportation networks (Fly, ferry…) | ❌ (`transportationTypes: string[]`) | M3 | |
| Shops | ❌ | M3 | |
| TM/HM list | ❌ | M3 | |
| Progression definitions (milestone/numeric/boolean) | ✅ | — | |
| Progression `choice` kind | ❌ | M0b | |
| Deploy/undeploy with playability validation | 🟡 (toggle only, `deployable` never computed) | M3 | Publish → release |

### Playing
| Feature | Status | Milestone |
|---|---|---|
| Create character + start journey (1 active journey per user per region), onboarding, starter, rival setup | ❌ | M5 (+M4 scripts) |
| Travel graph with gating; map/current location | ❌ | M5 |
| Fly / transport | ❌ | M5 |
| Wild encounters (random, fishing, time) | ❌ | M5 |
| Battles: fight/switch | ❌ | M1 |
| Battles: run, bag items, catch | ❌ | M1 (sim hook) + M5 |
| Trainer battles, rival, gyms, Elite 4 | ❌ | M5 |
| EXP, level-ups, moves, evolution | ❌ | M5 |
| Party management, summaries | ❌ | M5 |
| Trading between players (same region) | ❌ | M5 |
| PC boxes | ❌ | M5 |
| Inventory/bag | ❌ | M5 |
| Shops buy/sell; money from battles | ❌ | M5 |
| Heal at centers; respawn on whiteout | ❌ | M5 |
| Profile/character view | ❌ | M5 |
| Progression tracking (badges, visited) | ❌ | M5 |

---

## M0a: Platform & Arena Foundations

> Issue-level drafts: [`../backlog/m0a-platform-arena-foundations.md`](../backlog/m0a-platform-arena-foundations.md)

**Epic: Org & Delivery Setup**
- [ ] Move `pokesandbox` and `pokemon-showdown` (→ `pokesandbox-showdown`) to the org; update README links, CODEOWNERS, agents.md (S)
- [ ] CI: lint + typecheck + unit tests on PR (M)
- [ ] Create labels (incl. `agent-ready`), issue types, milestones, and project board per [`github-project-setup.md`](github-project-setup.md) (S)
- [ ] Switch slash commands to global registration with per-server feature gating (M)

**Epic: Engine Skeleton** (Q18)
- [ ] Structured logging port; debug events out of Mongo (S)
- [ ] Scaffold `libs/engine` (pure TS, no discord.js) with repository and ContentProvider interfaces (M)
- [ ] `dispatch(journeyId, action)` with per-journey lock, revisions, action preconditions, session claims, action/event types, and error model (L)
- [ ] Injected `Clock` and seeded `Rng` (S)
- [ ] In-memory test harness (M)
- [ ] Scaffold `libs/core` (shared schemas, registries home) (S)
- [ ] Scaffold `libs/battle` + `BattlePort`/`ExternalActionResolver` interfaces. Nx module-boundary tags + lint rule enforcing core/engine/battle/authoring layering (webapp must not import battle) (M)

**Epic: Persistence & Data Basics**
- [ ] docker-compose Mongo as a replica set (transactions) for local dev (S)
- [ ] Cache policy: stop caching hydrated mutable docs. Use atomic `$set` for admin edits (M)
- [ ] Indexes and unique constraints across models (S)
- [ ] Reference species/items by Showdown ID. Rename DexEntry `showdownName` → `speciesId`. Fix the 3 broken Gen 2 shiny sprite links (M)

## M0b: Content Foundations

> Issue-level drafts: [`../backlog/m0b-content-foundations.md`](../backlog/m0b-content-foundations.md)

**Epic: Conditions & Effects** (Q17)
- [ ] Condition tree (`all/any/not`) + fact/operator registry (evaluate/explain/validate/references) + scoped evaluation context (M)
- [ ] MVP facts: `milestone.has`, `milestone.count`, `choice.value`, `flag`, `bag.count`, `visited` (incl. `$target`), `party.knowsMove`, `party.hasSpecies`, `dex.caughtCount`, `progression.value`, `location.cleared`, `location.visit.*`, `location.trainersDefeated` (L)
- [ ] Gate envelope (`presentation`, `latch`, `cost`) + `checkGate` + `gateBlocked` event (M)
- [ ] Effect union + registry + atomic executor with idempotency (L)
- [ ] MVP effects: currency, item, progression, milestone (grant/revoke), choice, flag, setRespawn, random (L). `givePokemon` (PC + swap offer) and `heal` land in M5 with `PokemonInstance`.

**Epic: Model Cleanup & Identity** (Q19, Q21)
- [ ] ContentKey type + generator. Add `key` to Location with `{ regionId, key }` unique index (S)
- [ ] Remove `Region.locations/characterList/shops/quests/transportationTypes`, `Server.playerList`, `User.servers`. Add `Region.serverId` (M)
- [ ] Progression `choice` kind (+ builder) (M)
- [ ] Flag conventions (reserved prefixes) (S)
- [ ] Inbound-edge cleanup and "used by" guard on deletes (M)

**Epic: Authoring Layer & Releases** (Q15, Q18)
- [ ] Scaffold `libs/authoring` (`execute(actor, command)`, per-entity OCC, role checks, `ContentChange` + `suggestions` output) (M)
- [ ] Migrate existing admin menus (pokedex, progression, locations) onto `libs/authoring` commands (M)
- [ ] `RegionRelease` model + publish/compile + `ContentProvider` + deployment status (draft/live/paused) separate from discovery (L)

## M1: Battle Core & Catalog

**Epic: Showdown Fork Modernization** (Q20, decided)
- [ ] Preserve the 10 custom moves on an archive branch. Remove them from `master` and restore the 3 commented-out upstream tests (S)
- [ ] Rebase onto current upstream (fallback: fresh from upstream + re-apply kept patches as new commits) (M)
- [ ] Patch: generalized state injection (any side; HP/status/PP/fainted state; level/stats/move slots mid-battle for authentic level-ups), every injection recorded in the input log so recovery replays it, with sim tests (M)
- [ ] Patch: external choice hook (bag/catch/run consume turn) + `caught`/`ran` end reasons (L)
- [ ] Patch: isolated custom-data dexes (per content hash) for `Battle` + `TeamValidator`, evolved from `dynamic-dex-data` (L)
- [ ] Remove debug code (`pause`/`resume`/`sendToJSON`) (S)
- [ ] Publish as a versioned package consumed by the monorepo (then re-point the catalog imports M1-02/M1-03 at it and re-run). Set up the monthly upstream-sync PR. Rename to `pokesandbox-showdown` after the org move (M)

**Epic: Catalog**
- [ ] Canon catalog import from Showdown (pinned version): SpeciesDefinition, MoveDefinition (per-gen data via the resolved Dex, behavior `hooks`, text), Learnset (per-gen sources) into Mongo; re-runnable with diff on upgrades (L). Moves and learnsets drafted as E-M1-2 ([`m1-battle-core-and-catalog.md`](../backlog/m1-battle-core-and-catalog.md))
- [ ] Catalog read service + move detail display (M)
- [ ] ItemDefinition model + Gen 1 item seed (pockets, prices, field/battle handlers) (L)
- [ ] Piecemeal `RegionRules` model (holistic battle mechanics gen + per-dimension data/formula/graphics choices + gimmick toggles) with compatibility validation; then switch M1-04 and M3-03 from their "default Gen 1" to the region's rules (M)
- [ ] Gen 1 implementations for every dimension: Gen 1 mechanics (Showdown `gen1`), species stats, types, moves, learnsets, catch rates, EXP/catch/escape/payout formulas, original sprites, DVs/Stat Exp, the four Gen 1 growth curves (floored, level 1 clamped: intended behavior, no glitches). Reference: pret/pokered, with test vectors ([18](../architecture/concepts/18-rules-time-and-randomness.md#reference-test-vectors)). "Classic Gen 1" preset (L)
- [ ] Assemble per-release data mixes from Showdown gen mods into isolated custom-data dexes (M)

**Epic: Teams**
- [ ] `PokemonSet` shared type and `TeamPreset` model (S)
- [ ] `ArenaFormat` model (server-scoped) + built-in canon formats → Showdown custom format + TeamValidator (M)
- [ ] Showdown paste import/export (M)
- [ ] Guided team builder (Components v2 + FlowCord submenu/pagination flows; reuse the Pokédex builder's Pokémon search flow; autocomplete for moves). Can follow the Arena launch (L)
- [ ] Random legal team for a format + per-Pokémon validation error messages (M)

**Epic: BattleService**
- [ ] BattleService start/choose/events API, in-process (L)
- [ ] Battle persistence (seed + input log, `guildId`), battle leases (`ownerInstance` + heartbeat) and `ownsGuild` ownership, recovery on boot of owned unleased battles only (test: two overlapping processes run each battle once), compressed retention (7-day support window for adventure battles; Arena per replay policy) (M)
- [ ] Protocol → GameEvent translation; battle text from Showdown's text data, not hand-written strings (M)
- [ ] Discord battle view builders (pure `BattleView` → Components v2: turn messages, both actives with level/HP/status, the two sprites as separate images, choice prompts; a composed side-by-side image is post-MVP). The Arena wiring is in M2 E-M2-2 (L)
- [ ] Turn timers and timeout policy in BattleService: persisted per-side deadlines, `default` choice on timeout, forfeit after 3 consecutive, fresh window on recovery, `choose` with `rqid` + per-battle queue (M). Contract in [25 § Ownership](../architecture/concepts/25-arena.md#ownership)

**Epic: AI Players**
- [ ] AI player interface + `random` profile (S)
- [ ] `basic` profile using `@smogon/calc`, plus trainer item use (heal at low HP, cure status) shared by all non-random profiles (M)
- [ ] `smart` profile (switching, status, items) (L)

## M2: Arena Release 🚀

> **FlowCord is no longer on the critical path (decided Oct 2026, Q34).** FlowCord menus are single-person actionable. BattleService owns rounds and timers. The Arena's shared surfaces (challenges, public battle message, participant checks, private prompts) are plain discord.js handlers behind a `BattleSurface` port (E-M2-2), and FlowCord runs the single-user `/arena` hub. The FlowCord issues that would help (flowcord#105–#107) are listed in [M2 § FlowCord dependencies](../backlog/m2-launch-readiness.md#flowcord-dependencies). See [25 § Multiplayer boundary](../architecture/concepts/25-arena.md#multiplayer-boundary-with-flowcord-decided-oct-2026-q34).

**Epic: Launch Readiness: Hosting & Operations** (Q30, see [21](../architecture/concepts/21-hosting-and-environments.md); drafts in [`../backlog/m2-launch-readiness.md`](../backlog/m2-launch-readiness.md))
Scheduled last on the Arena track. Development runs locally until then.
- [ ] Choose and set up a managed app host (or the offered family host): always-on bot service + webapp, env secrets, custom domain/TLS (M)
- [ ] Atlas: prod database on the free cluster, separate staging/dev databases, IP allowlist, least-privilege users (S)
- [ ] Nightly `mongodump` backups to object storage with retention + a tested restore (M)
- [ ] GitHub Actions deploy: version tag → prod; `master` → staging (staging added before the Arena goes public) (M)
- [ ] Error monitoring (Sentry) + uptime check (S)
- [ ] Dependency security: clear Dependabot alerts (critical/high fixed or justified), enable Dependabot updates, CI audit gate (M2-14) (M)

- [ ] Challenge/accept/decline: direct + open challenges, atomic claim, 5-min expiry (M2-09) (M)
- [ ] Arena interaction router with stable custom IDs (M2-08) + private choice prompts (M2-11) (M)
- [ ] `/arena` hub: teams, challenge member, battle AI (M)
- [ ] Public battle message projector + spectating, re-attached after restart (M2-10) (M)
- [ ] Arena scenario tests + restart drill (M2-12) (S)
- [ ] PvAI: random legal team generated from the format, difficulty by AI profile (M)
- [ ] Battle history list (per user) (S)
- [ ] Alpha test on the community server; feedback triage (M)
- [ ] Release notes + admin/player docs (S)

## M3: Region Authoring
- [ ] Region config menu: currency object, starting location, respawn, rules preset (M)
- [ ] Location kinds, grouping (`parentKey`), description/image, services, tags (M)
- [ ] Connections editor with two-way toggle and labels (M)
- [ ] Condition builder UI (flat "all of" + one nesting level + templates) (L)
- [ ] Encounter method registry + conditioned encounter tables + builder (L)
- [ ] TM/HM list + learnset policy menu (M). TM/HM lists drafted as E-M3-1 ([`m3-region-authoring.md`](../backlog/m3-region-authoring.md))
- [ ] Transport networks + Fly/Ferry templates (M)
- [ ] Shops with conditioned entries and progression-priced entries (M)
- [ ] Validator Tier 1 + basic Tier 2 + "Region Health" view (L)
- [ ] Release chunking for large regions + rollback hooks (publish core lands in M0b) (M)
- [ ] Region bundle export/import (JSON) (M)

**Epic: Webapp Authoring (Q24)** (can run in parallel with M3/M4 once the matching `libs/authoring` commands exist)
- [ ] Webapp authoring shell: Discord-role-checked access to a region's draft, entity-level conflict handling (M)
- [ ] Shared condition builder component (M)
- [ ] Region map canvas (locations, directional/two-way edges, grouping, gate badges) (L)
- [ ] Encounter table grid (M)
- [ ] Trainer party editor with conditioned variants; unset moves default to the last 4 level-up moves from the region's learnsets (M)
- [ ] Script step editor (L)
- [ ] Region Health view (read-only) (S)
- [ ] Player profile + character pages (with their journeys) and privacy settings (M)

## M4: Interaction Engine (Q16)
- [ ] Script + Trigger models (M)
- [ ] Script VM: steps `passage` (prose, dialogue lines, images; `say` as shorthand) and `choice/if/effects/battle/wildBattle/npcTrade/askName/heal/shop/travel/goto/end`, `{name:<slot>}` placeholders (L)
- [ ] Mode machine + persisted script cursor + resume on input (M)
- [ ] Trigger dispatch: journeyStarted (payload: `newCharacter`, `carriedPokemon`), enterLocation (optional `from`/`via` filters; any arrival counts), interact, battleEnd, explore; once/priority/forced (M)
- [ ] TrainerClass registry (canon seed) + Trainer with conditioned party variants (M)
- [ ] NPC model (location, visibility, interact, trainer, engagement) (M)
- [ ] Script step-list editor in Discord (L)
- [ ] Templates: Gym Leader, Starter/Pick-N Gift, Forced Encounter, Gift NPC, In-game Trade, Gauntlet, Simple Talker (L)

## M5: Adventure Core
- [ ] Journey + PokemonInstance models, OCC, transactions (M)
- [ ] Character creation (with an `idNo`; the character is the original trainer of Pokémon it obtains) + journey start (1 active journey per user per region) + name slots (`Journey.names`; Kanto Classic names the rival) + restart (archive, 24h cooldown) + admin reset + onboarding trigger + release-version migration rules (M)
- [ ] Passage renderer: Components v2, `dialogue` and `prose` styles, markdown, auto-paging by text/component budget, choices on the last page (M)
- [ ] `/play` hub renderer (mode-aware): claims the session (newest wins), resumes any mode incl. mid-battle requests and pending prompts, and shuts down superseded sessions cleanly (L)
- [ ] Travel action (conditions, locked explanations, enter triggers, visited tracking) (M)
- [ ] Transport action (Fly menu): destinations grouped by area, fares shown, unaffordable options locked with the reason (S)
- [ ] Explore action: weighted outcome table (wild/trainer/hidden item), Repel safe steps, trainer engagement (M)
- [ ] Traversal requirements: location progress counters (lifetime/visit), one-time + permanent costs, compiled exit gates with explanations (M)
- [ ] Wild battles: catch formula, run odds, bag in battle (via hook) (L)
- [ ] Trainer battles: party variant selection, AI profile, payout, defeat flags, whiteout (M)
- [ ] EXP and level-ups mid-battle (state injection), in-battle move-learn prompts, post-battle and post-trade evolution (level/stone/trade), Gen 1 traded-Pokémon EXP bonus and obedience by original trainer (L)
- [ ] Party view/reorder/summary; full party → PC + "Swap into party?" offer for gifts and catches (M)
- [ ] PC boxes: deposit/withdraw/release, overflow, access per `RegionRules.systems.storage.access` (M)
- [ ] Bag: pockets, use/give/take outside battle; Escape Rope uses the `teleport: respawn` effect (M)
- [ ] Shops buy/sell, including entries priced in a numeric progression (coins); money never below 0 (S)
- [ ] Heal points (restore HP, status, and PP) + respawn (S)
- [ ] Profile: badge case, milestones, visited, dex (M)
- [ ] **Trading** (Q35): `Trade` record + shared trade message + private Pokémon pickers (reusing the M2 Arena surface patterns), confirm-reset on offer change, expiry (M)
- [ ] Two-journey engine action: ordered leases, re-checks, owner swap in one transaction, both revisions and Pokédexes updated; `trading.access` precondition; per-user rate limit (M)
- [ ] Adventure log: engine-written entries (trainer battles with turn digests, catches, trades, releases, wild rollups, milestones, evolutions, scenes; Pokémon stored as snapshots so entries survive the 30-day release purge) + webapp log view; ephemeral opponent Pokémon from recipes (M)

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
- [ ] Dependency security re-check: no open critical/high Dependabot alerts before release (S)
- [ ] Admin guide + player guide + template walkthrough (M)
- [ ] Public release + discovery listing (S)
