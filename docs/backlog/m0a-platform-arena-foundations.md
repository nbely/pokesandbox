# M0a: Platform & Arena Foundations (backlog draft)

**Outcome:** the org and CI exist. The library skeletons (`core`, `engine`, `battle`) and their enforced boundaries are in place. The data layer is safe for real player state. This milestone blocks M1 (Battle Core) → M2 (Arena).

**Hosting and production environments moved to M2** ("Launch Readiness", see [`m2-launch-readiness.md`](m2-launch-readiness.md)). Nothing in M0a/M1 needs a deployed environment. Development runs locally, and hosting is the last step before the bot and Arena go live.

Refs: [`mvp.md`](../roadmap/mvp.md) · [`github-project-setup.md`](../roadmap/github-project-setup.md) · concepts [03](../architecture/concepts/03-engine-boundary-and-game-loop.md), [14](../architecture/concepts/14-battle-system-and-showdown.md), [15](../architecture/concepts/15-persistence-caching-concurrency.md)

---

## E-M0A-1 · Org & Delivery Setup
`Type: Epic` · `Priority: P0`

Move the repos to the org, get CI gating every PR, and give contributors and agents the rules they need to work safely.

### M0A-01 · Transfer repos to the org and rename the Showdown fork
`Type: Task` · `Parent: E-M0A-1` · `Priority: P0` · `Size: S` · `Labels: area:infra` · `Blocked by: —` · `agent-ready: no` · `Owner: owner`

**Summary:** Transfer `nbely/pokesandbox` and `nbely/pokemon-showdown` to the new org, renaming the fork to `pokesandbox-showdown`. Install the Claude GitHub App on the org.

**Acceptance criteria**
- Both repos live under the org. Old URLs redirect.
- The fork is named `pokesandbox-showdown`. Its default branch is unchanged.
- The Claude GitHub App is installed on the org with access to both repos.
- Branch protection on `master`: PRs required, owner review required, CI must pass (once M0A-04 lands).

### M0A-02 · Update repo references after the move
`Type: Task` · `Parent: E-M0A-1` · `Priority: P1` · `Size: S` · `Labels: area:docs` · `Blocked by: M0A-01` · `agent-ready: yes` · `Owner: agent`

**Summary:** Replace `nbely/...` links and references in README, issue templates, `agents.md`, `copilot-instructions.md`, and CODEOWNERS with the org paths.

**Acceptance criteria**
- `grep -r "github.com/nbely"` returns only intentional historical references.
- CODEOWNERS lists the owner for `*`.
- Links in the issue templates resolve.

**Refs:** [github-project-setup](../roadmap/github-project-setup.md)

### M0A-03 · GitHub bootstrap: labels, milestones, project
`Type: Task` · `Parent: E-M0A-1` · `Priority: P0` · `Size: S` · `Labels: area:infra` · `Blocked by: M0A-01` · `agent-ready: no` · `Owner: owner`

**Summary:** Run `scripts/github/bootstrap.sh` (authored alongside this backlog) to create the labels and milestones (M0a, M0b, M1–M6), and create the org Projects v2 board with the fields from `github-project-setup.md`.

**Acceptance criteria**
- All labels from `github-project-setup.md` exist, including `agent-ready`.
- Milestones M0a, M0b, and M1–M6 exist.
- The project has the Status, Priority, Size, Phase, Area, and Track fields and the views described.

### M0A-04 · CI: lint, typecheck, and unit tests on every PR
`Type: Task` · `Parent: E-M0A-1` · `Priority: P0` · `Size: M` · `Labels: area:infra` · `Blocked by: —` · `agent-ready: yes` · `Owner: agent`

**Summary:** A GitHub Actions workflow running `nx affected` lint, typecheck, and test on PRs and on pushes to `master`, with Node 22 and npm caching.

**Acceptance criteria**
- The workflow runs on `pull_request` and `push` to `master`.
- Uses `nx affected` with the correct base/head SHAs. A full run on `master`.
- Fails on lint errors, type errors, or test failures. Passes on the current `master`. Fix or explicitly skip pre-existing failures in this PR, with a note.
- The README shows a CI status badge.

### M0A-05 · Encode the architecture rules for contributors and agents
`Type: Task` · `Parent: E-M0A-1` · `Priority: P0` · `Size: M` · `Labels: area:docs` · `Blocked by: —` · `agent-ready: yes` · `Owner: agent`

**Summary:** Update `.github/agents.md` and `.github/copilot-instructions.md` with the decided rules, so humans and agents build the new shape and not the old one.

**Acceptance criteria**
- Document the package layering (`core` → `engine` / `battle` / `authoring` → apps) and the "apps compose, libs take ports" rule.
- Document content keys (region-scoped, separate from `_id`), Showdown IDs for canon content, and `<publisherId>:<slug>` for custom content.
- Document "no new logic in Discord menu handlers; gameplay goes through `engine.dispatch`, authoring through `authoring.execute`".
- Document conditions/effects/gates as the only gating and reward mechanisms.
- Document the cache policy (no hydrated mutable docs).
- Document the existing model code conventions, which live only in code today:
  - Zod entity schema is the source of truth, named `fooSchema`. The mirroring Mongoose schema is named `fooDbSchema`.
  - Embedded sub-schemas are standalone `Schema` consts with `{ _id: false }`.
  - Map fields are parsed with `zMapHydrator`.
- Each rule links its concept doc. Remove outdated guidance that contradicts the docs (e.g. "cache-first" for mutable docs).

**Refs:** [architecture README](../architecture/README.md), [03](../architecture/concepts/03-engine-boundary-and-game-loop.md), [02](../architecture/concepts/02-identity-and-references.md), [15](../architecture/concepts/15-persistence-caching-concurrency.md)

### M0A-06 · Scheduled agent pickup workflow
`Type: Task` · `Parent: E-M0A-1` · `Priority: P2` · `Size: M` · `Labels: area:infra` · `Blocked by: M0A-03, M0A-04` · `agent-ready: no` · `Owner: owner`

**Summary:** A scheduled workflow that picks the next eligible issue for an AI agent.

**Acceptance criteria**
- Selects the highest-priority issue that is `agent-ready`, unassigned, and unblocked in the current milestone.
- Never selects `Decision`/`Spike` issues or issues labeled `needs-decision`.
- Assigns before starting (no double pickup). Opens one PR per issue that links it.
- Can be disabled with a repo variable.

**Refs:** [github-project-setup § Team & workflow](../roadmap/github-project-setup.md#team--workflow-decided-oct-2026-q29)

### M0A-07 · Global slash command registration with per-server feature gating
`Type: Task` · `Parent: E-M0A-1` · `Priority: P1` · `Size: M` · `Labels: area:bot` · `Blocked by: —` · `agent-ready: no` · `Owner: junior`

**Summary:** Replace dev-guild-only registration (`interactions/guilds/1010726453974925402`) with global registration, plus a dev-guild override for local development.

**Acceptance criteria**
- Production registers commands globally. Dev mode registers to a configured test guild (env var).
- Commands not yet released can be hidden behind a per-server feature flag (`Server.settings.features`).
- Existing admin commands keep working. The old guild-folder structure is removed or documented as dev-only.

---

## E-M0A-2 · Library Skeleton & Boundaries
`Type: Epic` · `Priority: P0`

Create `libs/core`, `libs/engine`, and `libs/battle` with enforced layering and port-based construction, so the engine can run in both the bot and the webapp now and be extracted later.

### M0A-08 · Structured logging; keep debug events out of Mongo
`Type: Task` · `Parent: E-M0A-2` · `Priority: P1` · `Size: S` · `Labels: area:infra` · `Blocked by: M0A-09` · `agent-ready: yes` · `Owner: agent`

**Summary:** A structured JSON logger shared by the apps and libs (via an injected logger port), with correlation fields. Debug-level game events go to logs, never to Mongo collections.

**Acceptance criteria**
- A logger interface in `libs/core`, with an implementation in the apps. Libs never import a concrete logger.
- Fields: `env`, `actionId`, `journeyId`, `battleId`, `regionId`, `level`.
- Log level configured per environment.

**Refs:** [21 § Retention](../architecture/concepts/21-hosting-and-environments.md)

### M0A-09 · Scaffold `libs/core`
`Type: Task` · `Parent: E-M0A-2` · `Priority: P0` · `Size: S` · `Labels: area:engine` · `Blocked by: —` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- An Nx library `libs/core` with a path alias `@core/*`, Jest, and lint.
- Folders for `schemas/`, `registries/`, `formulas/`, `validation/`, and `ports/`, each with an `index.ts`.
- No dependencies on mongoose, discord.js, or Showdown (enforced by M0A-10).

**Refs:** [03 § Package layout](../architecture/concepts/03-engine-boundary-and-game-loop.md#package-layout--encapsulation-rules-decided-oct-2026)

### M0A-10 · Enforce module boundaries
`Type: Task` · `Parent: E-M0A-2` · `Priority: P0` · `Size: S` · `Labels: area:infra` · `Blocked by: M0A-09, M0A-11, M0A-15` · `agent-ready: yes` · `Owner: agent`

**Summary:** Nx project tags plus the `@nx/enforce-module-boundaries` lint rule for the decided layering.

**Acceptance criteria**
- Tags: `scope:core`, `scope:engine`, `scope:battle`, `scope:authoring`, `scope:app-bot`, `scope:app-webapp`, `scope:shared`.
- `core` depends on nothing internal. `engine`, `battle`, and `authoring` depend only on `core`. `app-webapp` cannot depend on `battle`.
- Banned external imports inside libs: `discord.js` in all libs, `mongoose` in `core`/`engine`/`battle`/`authoring`, Showdown outside `battle`.
- A deliberately violating import fails `nx lint` (verified in the PR description).

**Refs:** [03 § Package layout](../architecture/concepts/03-engine-boundary-and-game-loop.md#package-layout--encapsulation-rules-decided-oct-2026)

### M0A-11 · Scaffold `libs/engine` with ports and base action/event types
`Type: Task` · `Parent: E-M0A-2` · `Priority: P0` · `Size: M` · `Labels: area:engine` · `Blocked by: M0A-09` · `agent-ready: no` · `Owner: senior`

**Summary:** The engine package constructed entirely from injected ports: repositories, `ContentProvider`, `BattlePort`, `Clock`, `Rng`, `EventSink`, logger.

**Acceptance criteria**
- `createEngine(ports): Engine`, with no module-level singletons.
- Port interfaces are defined with serializable inputs and outputs.
- `GameAction` and `GameEvent` base discriminated unions (an extensible pattern; a no-op `ping` action for tests).
- The journey `mode` type (`overworld` | `script` | `battle`, with `participants[]`).
- A README explaining how apps wire the engine.

**Refs:** [03](../architecture/concepts/03-engine-boundary-and-game-loop.md)

### M0A-12 · `dispatch()` with a per-journey DB lease, revisions, preconditions, and session claims
`Type: Task` · `Parent: E-M0A-2` · `Priority: P0` · `Size: L` · `Labels: area:engine` · `Blocked by: M0A-11` · `agent-ready: no` · `Owner: senior`

**Summary:** The engine's write path, with all four checks from [03 § Per-journey serialization](../architecture/concepts/03-engine-boundary-and-game-loop.md#per-journey-serialization-revisions-preconditions-and-sessions-decided-oct-2026). Consider splitting the session claim into its own PR.

**Acceptance criteria**
- `dispatch(journeyId, action)` acquires a short lease (`locks` collection with a TTL index, via a `LockPort`), runs the handler, and releases.
- Lease contention waits up to ~1s, then returns `actionRejected: busy`.
- **Revisions:** `Journey.rev` increments once per action that writes any of the journey's game data (Journey, PokemonInstances, bag, flags), in the same transaction. Actions declare whether they're view-dependent. A view-dependent action with a stale `rev` is not applied and returns a `staleView` result so the client re-renders.
- **Preconditions:** each action declares its allowed modes. A precondition hook evaluates rules and content requirements (the first user is box access: `RegionRules.systems.storage.access` + location `services`). `availableActions(journey)` returns each action's availability with an explanation.
- **Session claim:** `claimSession(journeyId, client)` sets `Journey.activeSession` under the lease (newest wins). Session-bound actions with a non-active session ID are rejected as `sessionSuperseded`. Game-driven events and non-session clients are exempt.
- An optimistic-concurrency conflict retries once, only for actions without a `rev`.
- An action-cost step exists (always returns 0; reserved for pacing).
- An idempotency hook: an `actionId` is recorded and replays are ignored.
- A typed error model (`actionRejected` with an explanation vs internal errors).
- Tests: double dispatch (second press is stale, applied once), conflict retry (only for actions without a `rev`), lease expiry, a precondition rejection with its explanation, and a session takeover rejecting the old session.

**Refs:** [03 § Per-journey serialization](../architecture/concepts/03-engine-boundary-and-game-loop.md), [15](../architecture/concepts/15-persistence-caching-concurrency.md)

### M0A-13 · `Clock` and seeded `Rng`
`Type: Task` · `Parent: E-M0A-2` · `Priority: P1` · `Size: S` · `Labels: area:engine` · `Blocked by: M0A-09` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- `Clock` port: a system implementation and a fixed/test implementation.
- `Rng` port: a deterministic PRNG seeded by `hash(journeyId, actionId)`, with `int`, `float`, `pick`, and `weighted` helpers.
- Tests prove the same seed gives the same sequence.

**Refs:** [18 § Randomness](../architecture/concepts/18-rules-time-and-randomness.md)

### M0A-14 · In-memory test harness
`Type: Task` · `Parent: E-M0A-2` · `Priority: P1` · `Size: M` · `Labels: area:engine` · `Blocked by: M0A-11` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- In-memory implementations of every engine port, plus a `createTestEngine({ fixtures })` helper.
- Fixture builders for a tiny region (2–3 locations) and a journey.
- An example test dispatches an action and asserts on the emitted events.

### M0A-15 · Scaffold `libs/battle` with its interfaces
`Type: Task` · `Parent: E-M0A-2` · `Priority: P0` · `Size: S` · `Labels: area:battle` · `Blocked by: M0A-09` · `agent-ready: yes` · `Owner: agent`

**Summary:** The package and types only. The Showdown implementation is M1.

**Acceptance criteria**
- `BattlePort` (start/choose/inject/subscribe), `BattleSpec` (including the reserved `turnGate`), `StatePatch`, `BattleEvent`, `ExternalActionResolver`, `ExternalActionContext`/`Outcome`, and `TurnDigest` types.
- Everything crossing these interfaces is serializable (a test round-trips through `JSON`).
- No Showdown dependency yet.

**Refs:** [14 § Package placement](../architecture/concepts/14-battle-system-and-showdown.md), [22](../architecture/concepts/22-adventure-log-and-narration.md)

---

## E-M0A-3 · Persistence & Data Basics
`Type: Epic` · `Priority: P0`

Make the data layer safe for real player state: transactions, constraints, a safe cache, and canon IDs.

### M0A-16 · Local Mongo as a single-node replica set
`Type: Task` · `Parent: E-M0A-3` · `Priority: P0` · `Size: S` · `Labels: area:infra` · `Blocked by: —` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- `docker-compose.yml` starts Mongo with `--replSet` and auto-initiates the set.
- `npm run setup` still works end to end. A test or script proves `session.withTransaction` succeeds locally.
- `.env.example` connection string updated.

### M0A-17 · Indexes and unique constraints
`Type: Task` · `Parent: E-M0A-3` · `Priority: P0` · `Size: S` · `Labels: area:shared-models` · `Blocked by: M0A-16` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- Unique `Server.serverId` and `User.userId`. `Location { regionId, ordinal }`.
- Indexes are declared in the schemas and created on startup (`autoIndex` in dev) or by a migration script (prod). Documented.
- `ensureServerInitialized` no longer creates duplicates under concurrent first use (test or reasoning in the PR).

**Refs:** [15](../architecture/concepts/15-persistence-caching-concurrency.md)

### M0A-18 · Cache policy: no shared mutable documents
`Type: Task` · `Parent: E-M0A-3` · `Priority: P0` · `Size: M` · `Labels: area:bot` · `Blocked by: —` · `agent-ready: no` · `Owner: senior`

**Acceptance criteria**
- The cache stores only immutable/plain data (`lean()` objects, frozen in dev). No hydrated Mongoose documents in the cache.
- Admin edits use targeted atomic updates (`$set` on paths) instead of mutate-cached-doc-then-`save()`.
- Existing admin menus keep working (manual test list in the PR).

**Refs:** [15](../architecture/concepts/15-persistence-caching-concurrency.md)

### M0A-19 · Rename DexEntry `showdownName` → `speciesId`, and reference species by ID
`Type: Task` · `Parent: E-M0A-3` · `Priority: P0` · `Size: M` · `Labels: area:shared-models` · `Blocked by: M0A-17` · `agent-ready: yes` · `Owner: agent`

**Summary:** `showdownName` already holds the Showdown ID for all 1,371 seed entries. Rename it to `speciesId` (library entries will use the same ID type, so "Showdown name" stops being accurate) and make it the only way content refers to a species.

**Acceptance criteria**
- `DexEntry.showdownName` renamed to `speciesId` in the model, Zod schema, DTOs, seed data, and `apps/bot/src/utils/searchPokemon.ts`.
- A unique index on `speciesId`. Canon entries only: library overrides and imports share species IDs by design and live in the library model later ([12 § Mongo shape](../architecture/concepts/12-content-catalog-species-moves-items.md#mongo-shape)).
- DexEntry's own links (`baseSpecies`, `prevo`, `evos`, `formes`) store `speciesId` strings instead of `{ id: ObjectId, name }`.
- Encounter slots (`wildTable` `speciesId`, today an ObjectId) and region pokedex slots reference `speciesId` strings. DTOs updated.
- Seed fix: `Unown-!` / `Unown-?` use Showdown's IDs `unownexclamation` / `unownquestion` (currently `unown!` / `unown?`). A test asserts every seed `speciesId` equals Showdown's `toID` of its Showdown name.
- A migration script for existing databases (rename the field, convert ObjectId references to IDs).
- `docs/erd.md` regenerated.

**Refs:** [02](../architecture/concepts/02-identity-and-references.md), [12](../architecture/concepts/12-content-catalog-species-moves-items.md)

### M0A-20 · Sprite URL resolver and broken link fixes
`Type: Task` · `Parent: E-M0A-3` · `Priority: P2` · `Size: S` · `Labels: area:shared-models` · `Blocked by: —` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- `resolveSpriteUrl(species, { gen, game, palette, shiny, facing })` is the only way UI code gets sprite URLs. It falls back to the Showdown sprite CDN.
- Fix the 3 Gen 2 shiny entries that point at `imgur.com/<id>` pages (Weedle, Kakuna, Beedrill) to direct `i.imgur.com/<id>.png` images.
- Footprint/shape Bulbagarden hotlinks are listed in an issue for later mirroring (not fixed here).

**Refs:** [open-questions Q32](../architecture/open-questions.md)
