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
| Q10 | Arena teams validated against **a region's dex/rules** (needs a region first) or **server-wide standard formats** too? | Region-scoped formats + one built-in "Kanto Classic" format so it works before any region exists | |
| Q11 | Level normalization (50/100/as-built) and **clauses** (species, sleep, OHKO, evasion)? | Lv 50, Showdown standard clauses | |
| Q12 | Team building UX: **Showdown paste import** acceptable as the primary path, with a guided builder second? | Yes | |
| Q13 | Turn **timer** length and timeout behavior (random move vs forfeit after N)? | 90s, default move, forfeit after 3 | |
| Q14 | Player-vs-AI: AI picks from **pre-authored teams per tier**, or **random legal teams**? | Random legal teams per tier first | |

## Architecture direction (the big alternates)

| # | Question | Recommendation | Answer |
|---|---|---|---|
| Q15 | Adopt **draft → published releases** (admins edit freely; players play immutable versions)? | Yes ([01](concepts/01-content-vs-state-and-publishing.md)) | |
| Q16 | Commit to a **step-based Script system** for triggers/NPCs/gifts/gauntlets instead of bespoke features? | Yes ([07](concepts/07-scripts-triggers-and-events.md)) | |
| Q17 | Replace bucketed requirements with a **Condition tree** (all/any/not + predicate registry)? | Yes ([05](concepts/05-requirements.md)) | |
| Q18 | Introduce **`libs/engine`** (pure domain package, actions in, events out) before player features? | Yes ([03](concepts/03-engine-boundary-and-game-loop.md)) | |
| Q19 | Reference canon content by **Showdown IDs** and authored content by **content keys** instead of ObjectIds? | Yes ([02](concepts/02-identity-and-references.md)) | |
| Q20 | **Rebase and slim the Showdown fork** (patch set + mod) before integrating? | Yes ([14](concepts/14-battle-system-and-showdown.md)) | |
| Q21 | Split **engine-managed flags** from curated progressions? | Yes ([04](concepts/04-progression-and-flags.md)) | |
| Q22 | Pokémon instances as their **own collection**? | Yes ([13](concepts/13-characters-and-pokemon-instances.md)) | |
| Q33 | Stay on **MongoDB** (properly configured, behind repository interfaces), with Postgres re-evaluated at Phase 3 and SpacetimeDB as a spike-only watch item? | Yes ([20](concepts/20-database-and-realtime-platform.md)) | |

## Scope & ownership

| # | Question | Why | Answer |
|---|---|---|---|
| Q23 | Will regions ever be **shared across servers** (install a published region on many servers)? | Ownership model, discovery | |
| Q24 | Is the **webapp builder** in MVP scope (for scripts/graphs), or strictly Discord authoring? | Authoring capacity for a full Kanto | |
| Q25 | Is a maintained **"Kanto Classic" template** an official deliverable? (It doubles as the MVP acceptance test.) | Testing, onboarding | |
| Q26 | What does `baseGeneration` mean today, and is it safe to replace with `RegionRules`? | Model cleanup | |
| Q27 | **1 character per region** firm? Can players restart/delete characters? | Character model, abuse | |
| Q28 | Does New Logora content need to survive, or can it be dropped/moved to a mod? | Fork rebase effort | |
| Q29 | Team & cadence after the org move: how many contributors, expected weekly hours, and do you want issues sized for juniors (good-first-issue) vs epics only? | Backlog granularity | |
| Q30 | Hosting target for MVP (single VM? Atlas?), expected server count at launch, backup expectations? | Infra milestones | |
| Q31 | **Undeploy** semantics: pause play (characters frozen) or hide region (discovery off)? | Publishing model | |
| Q32 | Sprite and asset hosting: Showdown sprite CDN vs self-hosted? Any legal constraints you want to adopt as policy? | Graphics settings | |
