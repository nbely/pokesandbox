# Open Questions (High-Level)

Questions for the project owner. Answers shape the MVP backlog. Grouped by theme and roughly ordered by how much they change the plan. Record each answer in the "Answer" column (or as a follow-up issue) so the decision trail lives in the repo.

## Product & game feel

| # | Question | Why it matters | Default if unanswered | Answer |
|---|---|---|---|---|
| Q1 | "Recreate RBY": **authentic Gen 1 mechanics** or **RBY content on modern mechanics** (Fairy, phys/spec split, abilities, held items)? | Decides which formulas and Showdown format MVP implements | Modern mechanics, Gen 1 content; "Classic Gen 1" preset later | |
| Q2 | Where does adventure play happen: **ephemeral (private)**, **per-player threads**, or **public channels**? Server-configurable? | Rendering, spam, RP/social feel, rate limits | Ephemeral by default, public option later | |
| Q3 | How are **wild encounters** triggered: "Explore" button, rolled on traversal, or visible spawns? | The core-loop feel | Explore button per method | |
| Q4 | How do **trainers engage**: on entering, on explore, on talk? Do undefeated trainers block route exits? | Pacing, difficulty | On explore, optional per trainer; no blocking | |
| Q5 | Is travel **instant** between nodes, or does traversing a route cost steps/time? | Pacing, encounter design | Instant | |
| Q6 | **Day/night model**: real time in the server's timezone, accelerated, or none for MVP? | Encounters, events | Real time, server timezone | |
| Q7 | Do you want a **visual region map** in MVP or text-only navigation? | Asset pipeline, UI | Text-only + optional static map image | |
| Q8 | **Level-ups mid-battle** (authentic) or post-battle (simpler)? | Showdown patch scope | Post-battle | |
| Q9 | Full party: **auto-send to PC** or **prompt to swap**? | UX | Rule toggle, default PC | |

## Pre-MVP Arena

| # | Question | Default | Answer |
|---|---|---|---|
| Q10 | Arena teams validated against **a region's dex/rules** (needs a region first) or **server-wide standard formats** too? | Region-scoped formats + one built-in "Kanto Classic" format so it works before any region exists | **Decided (Oct 2026):** Not region-scoped. Custom content (fakemon, moves, items) lives in a **server content library** reusable across regions, e.g. sequels. Arena formats are **server-scoped**: built-in canon formats work out of the box, and admins can define formats mixing canon and library content (a region's dex is just an optional pool source). See [12](concepts/12-content-catalog-species-moves-items.md#server-content-library-decided-oct-2026) and [14](concepts/14-battle-system-and-showdown.md#arena-formats-decided-oct-2026-server-scoped-not-region-scoped). |
| Q11 | Level normalization (50/100/as-built) and **clauses** (species, sleep, OHKO, evasion)? | Lv 50, Showdown standard clauses | |
| Q12 | Team building UX: **Showdown paste import** acceptable as the primary path, with a guided builder second? | Yes | |
| Q13 | Turn **timer** length and timeout behavior (random move vs forfeit after N)? | 90s, default move, forfeit after 3 | |
| Q14 | Player-vs-AI: AI picks from **pre-authored teams per tier**, or **random legal teams**? | Random legal teams per tier first | |

## Architecture direction (the big alternates)

| # | Question | Recommendation | Answer |
|---|---|---|---|
| Q15 | Adopt **draft → published releases** (admins edit freely; players play immutable versions)? | Yes ([01](concepts/01-content-vs-state-and-publishing.md)) | **Decided (Oct 2026):** Yes. Draft → validate → immutable `RegionRelease`. Release notes are opt-in per server with a configurable channel (models now, UI later). Play-the-draft preview is later, but designed for now. See [01 § Decisions](concepts/01-content-vs-state-and-publishing.md#decisions-oct-2026). |
| Q16 | Commit to a **step-based Script system** for triggers/NPCs/gifts/gauntlets instead of bespoke features? | Yes ([07](concepts/07-scripts-triggers-and-events.md)) | **Decided (Oct 2026):** Yes, as long as scripts are easy to build (templates first). People-here list (to be cemented later). MVP = plain paged dialogue, with a `presentation` field reserved for rich embeds/Components v2 later. **Principle: everything is editable in Discord**, including a script step editor; the webapp is additive. See [07 § Decisions](concepts/07-scripts-triggers-and-events.md#decisions-oct-2026). |
| Q17 | Replace bucketed requirements with a **Condition tree** (all/any/not + predicate registry)? | Yes ([05](concepts/05-requirements.md)) | **Decided (Oct 2026):** Yes, refined as facts + operators, scoped evaluation, Gate envelope, usage policies, and dependency tracking ([05 § stress test](concepts/05-requirements.md#is-this-the-right-pattern-stress-test-against-scripts-quests-and-every-gate)). Lock presentation is caller-owned (`hidden` default / `locked` / `attemptable` → `gateBlocked` trigger). HM rules are creator content, with builder templates and suggestions post-MVP. Text syntax later, very low priority. MVP fact list decided against RBY needs (see [05 § MVP scope](concepts/05-requirements.md#mvp-scope)). Blackout respawn is character state, not a fact. |
| Q18 | Introduce **`libs/engine`** (pure domain package, actions in, events out) before player features? | Yes ([03](concepts/03-engine-boundary-and-game-loop.md)) | **Decided (Oct 2026):** Option C. Gameplay rules live in `libs/engine` (actions in, events out). Admin authoring gets the same treatment in a sibling `libs/authoring` package so the Discord builder and a webapp builder share one set of commands, validation, and integrity rules (see [03 § Authoring](concepts/03-engine-boundary-and-game-loop.md#authoring-the-same-pattern-for-region-building)). Built inside the monorepo (no separate repo/package), and extra scaffolding time is accepted to get the foundation right. |
| Q19 | Reference canon content by **Showdown IDs** and authored content by **content keys** instead of ObjectIds? | Yes ([02](concepts/02-identity-and-references.md)) | **Decided (Oct 2026):** Canon by Showdown ID. Custom species namespaced by an opaque **publisher ID** (display name shown in UI). Library entries are *original* or *linked* (pinned base + local patch), which covers both canon overrides and editable imports with clean upgrades; one definition per species ID per region. Move/item/ability overrides come post-MVP with custom moves. Authored content uses **opaque region-scoped keys** separate from `_id` (copy-safe; never player-facing; names resolved in UI). User server list = derived Discord membership + stored favorites/layout. See [02](concepts/02-identity-and-references.md), [12 § Species identity](concepts/12-content-catalog-species-moves-items.md#species-identity-canon-custom-species-variants-overrides--sharing-proposed-oct-2026). |
| Q20 | **Rebase and slim the Showdown fork** (patch set + mod) before integrating? | Yes ([14](concepts/14-battle-system-and-showdown.md)) | |
| Q21 | Split **engine-managed flags** from curated progressions? | Yes ([04](concepts/04-progression-and-flags.md)) | |
| Q22 | Pokémon instances as their **own collection**? | Yes ([13](concepts/13-characters-and-pokemon-instances.md)) | |
| Q33 | Stay on **MongoDB** (properly configured, behind repository interfaces), with Postgres re-evaluated at Phase 3 and SpacetimeDB as a spike-only watch item? | Yes ([20](concepts/20-database-and-realtime-platform.md)) | **Decided (Oct 2026):** stay on MongoDB. Live PvP stays in Discord for the foreseeable future; moving play fully to the webapp is ~1–2% likely, so SpacetimeDB is shelved. |

## Scope & ownership

| # | Question | Why | Answer |
|---|---|---|---|
| Q23 | Will regions ever be **shared across servers** (install a published region on many servers)? | Ownership model, discovery | **Partially answered (Oct 2026):** Library content (species, moves, items…) can be published publicly and imported by other servers (private by default). Whether whole *regions* can be shared/installed across servers is still open. |
| Q24 | Is the **webapp builder** in MVP scope (for scripts/graphs), or strictly Discord authoring? | Authoring capacity for a full Kanto | **Partially answered (Oct 2026):** Discord must be authoring-complete. The webapp builder is an additive client of the same commands. Its MVP scope is still open. |
| Q25 | Is a maintained **"Kanto Classic" template** an official deliverable? (It doubles as the MVP acceptance test.) | Testing, onboarding | |
| Q26 | What does `baseGeneration` mean today, and is it safe to replace with `RegionRules`? | Model cleanup | |
| Q27 | **1 character per region** firm? Can players restart/delete characters? | Character model, abuse | |
| Q28 | Does New Logora content need to survive, or can it be dropped/moved to a mod? | Fork rebase effort | |
| Q29 | Team & cadence after the org move: how many contributors, expected weekly hours, and do you want issues sized for juniors (good-first-issue) vs epics only? | Backlog granularity | |
| Q30 | Hosting target for MVP (single VM? Atlas?), expected server count at launch, backup expectations? | Infra milestones | |
| Q31 | **Undeploy** semantics: pause play (characters frozen) or hide region (discovery off)? | Publishing model | **Decided (Oct 2026):** Deployment and discovery are independent. Undeploy = play unavailable, characters frozen. Region-level discovery is its own setting, so an undeployed, in-progress region can still be listed for sneak peeks. See [01 § Decisions](concepts/01-content-vs-state-and-publishing.md#decisions-oct-2026). |
| Q32 | Sprite and asset hosting: Showdown sprite CDN vs self-hosted? Any legal constraints you want to adopt as policy? | Graphics settings | |
