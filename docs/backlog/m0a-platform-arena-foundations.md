# M0a: Platform & Arena Foundations (backlog draft)

**Outcome:** the org, CI, hosting, and environments exist. The library skeletons (`core`, `engine`, `battle`) and their enforced boundaries are in place. The data layer is safe for real player state. This milestone blocks M1 (Battle Core) → M2 (Arena).

Refs: [`mvp.md`](../roadmap/mvp.md) · [`github-project-setup.md`](../roadmap/github-project-setup.md) · concepts [03](../architecture/concepts/03-engine-boundary-and-game-loop.md), [14](../architecture/concepts/14-battle-system-and-showdown.md), [15](../architecture/concepts/15-persistence-caching-concurrency.md), [21](../architecture/concepts/21-hosting-and-environments.md)

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

## E-M0A-2 · Hosting & Environments
`Type: Epic` · `Priority: P0`

A managed host for the always-on bot and the webapp, MongoDB Atlas with backups, deploy pipelines, monitoring, and a staging environment before the Arena goes public.

### M0A-08 · Choose the host and provision prod app services
`Type: Task` · `Parent: E-M0A-2` · `Priority: P0` · `Size: M` · `Labels: area:infra` · `Blocked by: M0A-09` · `agent-ready: no` · `Owner: owner`

**Summary:** Decide between the offered family host and a managed host (Railway/Fly/Render class). Provision an always-on bot service and a webapp service.

**Acceptance criteria**
- The host supports always-on Node processes (Discord gateway + in-memory battles) and Docker images.
- The prod bot and webapp run from images built in CI, with secrets in the host's secret store.
- The webapp has a domain with TLS. The Discord OAuth redirect URIs are updated.
- Cost and plan details are recorded in [21](../architecture/concepts/21-hosting-and-environments.md).

**Refs:** [21](../architecture/concepts/21-hosting-and-environments.md)

### M0A-09 · Containerize the bot and webapp
`Type: Task` · `Parent: E-M0A-2` · `Priority: P0` · `Size: M` · `Labels: area:infra` · `Blocked by: —` · `agent-ready: yes` · `Owner: agent`

**Summary:** Production Dockerfiles for `apps/bot` and `apps/webapp` (multi-stage, Nx build), plus a `docker-compose.yml` profile that runs both locally against the dev Mongo.

**Acceptance criteria**
- `docker build` produces runnable images for both apps. Images run as non-root. Final images contain no dev dependencies.
- The local compose profile starts Mongo (see M0A-23), the bot, and the webapp, using `.env`.
- The README documents the commands.

### M0A-10 · Atlas setup: prod, staging, and dev databases
`Type: Task` · `Parent: E-M0A-2` · `Priority: P0` · `Size: S` · `Labels: area:infra` · `Blocked by: —` · `agent-ready: no` · `Owner: owner`

**Acceptance criteria**
- An Atlas free cluster with separate `prod` and `staging` databases. Developers use local Mongo.
- A least-privilege DB user per environment. The network allowlist is restricted to the host egress where possible.
- Connection strings are stored only in the host's secret store and GitHub secrets.

### M0A-11 · Nightly backups with a tested restore
`Type: Task` · `Parent: E-M0A-2` · `Priority: P0` · `Size: M` · `Labels: area:infra` · `Blocked by: M0A-08, M0A-10` · `agent-ready: no` · `Owner: senior`

**Summary:** Atlas Free has no backups, so run a scheduled `mongodump` of `prod` to free-tier object storage (e.g. R2), with retention.

**Acceptance criteria**
- Runs nightly with 14–30 day retention. Failures alert the owner.
- A documented restore procedure, exercised once by restoring into `staging`.
- Backup credentials are scoped to a single bucket.

### M0A-12 · Deploy pipeline
`Type: Task` · `Parent: E-M0A-2` · `Priority: P1` · `Size: M` · `Labels: area:infra` · `Blocked by: M0A-04, M0A-08, M0A-09` · `agent-ready: no` · `Owner: senior`

**Acceptance criteria**
- Version tag `v*` → build, push images, deploy prod.
- Merge to `master` → deploy staging, once M0A-14 exists. Until then, build only.
- Rollback = redeploying the previous tag. Documented.
- Slash-command registration runs as a deploy step (not on every bot boot).

### M0A-13 · Error monitoring and uptime checks
`Type: Task` · `Parent: E-M0A-2` · `Priority: P1` · `Size: S` · `Labels: area:infra` · `Blocked by: M0A-08` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- Sentry (free tier) wired into the bot and webapp. Errors are tagged with environment, `characterId`/`actionId`/`battleId` where available, and release version.
- An uptime check on the webapp plus a bot heartbeat (e.g. a health endpoint or a periodic ping), alerting the owner.

### M0A-14 · Staging environment
`Type: Task` · `Parent: E-M0A-2` · `Priority: P1` · `Size: M` · `Labels: area:infra` · `Blocked by: M0A-08, M0A-10` · `agent-ready: no` · `Owner: owner`

**Summary:** A second deployment of the bot and webapp with its own Discord application/bot token and test guild, using the `staging` database. Required before the Arena goes public.

**Acceptance criteria**
- The staging bot runs in a test guild and doesn't share tokens or DBs with prod.
- A documented "migration rehearsal": restore last night's prod dump into staging, then deploy the candidate release.

### M0A-15 · Structured logging; keep debug events out of Mongo
`Type: Task` · `Parent: E-M0A-2` · `Priority: P1` · `Size: S` · `Labels: area:infra` · `Blocked by: —` · `agent-ready: yes` · `Owner: agent`

**Summary:** A structured JSON logger shared by the apps and libs (via an injected logger port), with correlation fields. Debug-level game events go to logs, never to Mongo collections.

**Acceptance criteria**
- A logger interface in `libs/core`, with an implementation in the apps. Libs never import a concrete logger.
- Fields: `env`, `actionId`, `characterId`, `battleId`, `regionId`, `level`.
- Log level configured per environment.

**Refs:** [21 § Retention](../architecture/concepts/21-hosting-and-environments.md)

---

## E-M0A-3 · Library Skeleton & Boundaries
`Type: Epic` · `Priority: P0`

Create `libs/core`, `libs/engine`, and `libs/battle` with enforced layering and port-based construction, so the engine can run in both the bot and the webapp now and be extracted later.

### M0A-16 · Scaffold `libs/core`
`Type: Task` · `Parent: E-M0A-3` · `Priority: P0` · `Size: S` · `Labels: area:engine` · `Blocked by: —` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- An Nx library `libs/core` with a path alias `@core/*`, Jest, and lint.
- Folders for `schemas/`, `registries/`, `formulas/`, `validation/`, and `ports/`, each with an `index.ts`.
- No dependencies on mongoose, discord.js, or Showdown (enforced by M0A-17).

**Refs:** [03 § Package layout](../architecture/concepts/03-engine-boundary-and-game-loop.md#package-layout--encapsulation-rules-decided-oct-2026)

### M0A-17 · Enforce module boundaries
`Type: Task` · `Parent: E-M0A-3` · `Priority: P0` · `Size: S` · `Labels: area:infra` · `Blocked by: M0A-16, M0A-18, M0A-22` · `agent-ready: yes` · `Owner: agent`

**Summary:** Nx project tags plus the `@nx/enforce-module-boundaries` lint rule for the decided layering.

**Acceptance criteria**
- Tags: `scope:core`, `scope:engine`, `scope:battle`, `scope:authoring`, `scope:app-bot`, `scope:app-webapp`, `scope:shared`.
- `core` depends on nothing internal. `engine`, `battle`, and `authoring` depend only on `core`. `app-webapp` cannot depend on `battle`.
- Banned external imports inside libs: `discord.js` in all libs, `mongoose` in `core`/`engine`/`battle`/`authoring`, Showdown outside `battle`.
- A deliberately violating import fails `nx lint` (verified in the PR description).

**Refs:** [03 § Package layout](../architecture/concepts/03-engine-boundary-and-game-loop.md#package-layout--encapsulation-rules-decided-oct-2026)

### M0A-18 · Scaffold `libs/engine` with ports and base action/event types
`Type: Task` · `Parent: E-M0A-3` · `Priority: P0` · `Size: M` · `Labels: area:engine` · `Blocked by: M0A-16` · `agent-ready: no` · `Owner: senior`

**Summary:** The engine package constructed entirely from injected ports: repositories, `ContentProvider`, `BattlePort`, `Clock`, `Rng`, `EventSink`, logger.

**Acceptance criteria**
- `createEngine(ports): Engine`, with no module-level singletons.
- Port interfaces are defined with serializable inputs and outputs.
- `GameAction` and `GameEvent` base discriminated unions (an extensible pattern; a no-op `ping` action for tests).
- The character `mode` type (`overworld` | `script` | `battle`, with `participants[]`).
- A README explaining how apps wire the engine.

**Refs:** [03](../architecture/concepts/03-engine-boundary-and-game-loop.md)

### M0A-19 · `dispatch()` with a per-character DB lease and optimistic concurrency
`Type: Task` · `Parent: E-M0A-3` · `Priority: P0` · `Size: M` · `Labels: area:engine` · `Blocked by: M0A-18` · `agent-ready: no` · `Owner: senior`

**Acceptance criteria**
- `dispatch(characterId, action)` acquires a short lease (`locks` collection with a TTL index, via a `LockPort`), runs the handler, and releases.
- Concurrent dispatches for the same character: the second gets `actionRejected: busy` (or waits briefly; document which).
- An optimistic-concurrency conflict retries the action once.
- An action-cost step exists (always returns 0; reserved for pacing).
- An idempotency hook: an `actionId` is recorded and replays are ignored.
- A typed error model (`actionRejected` with an explanation vs internal errors).
- Tests: double dispatch, conflict retry, lease expiry.

**Refs:** [03 § Per-character serialization](../architecture/concepts/03-engine-boundary-and-game-loop.md), [15](../architecture/concepts/15-persistence-caching-concurrency.md)

### M0A-20 · `Clock` and seeded `Rng`
`Type: Task` · `Parent: E-M0A-3` · `Priority: P1` · `Size: S` · `Labels: area:engine` · `Blocked by: M0A-16` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- `Clock` port: a system implementation and a fixed/test implementation.
- `Rng` port: a deterministic PRNG seeded by `hash(characterId, actionId)`, with `int`, `float`, `pick`, and `weighted` helpers.
- Tests prove the same seed gives the same sequence.

**Refs:** [18 § Randomness](../architecture/concepts/18-rules-time-and-randomness.md)

### M0A-21 · In-memory test harness
`Type: Task` · `Parent: E-M0A-3` · `Priority: P1` · `Size: M` · `Labels: area:engine` · `Blocked by: M0A-18` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- In-memory implementations of every engine port, plus a `createTestEngine({ fixtures })` helper.
- Fixture builders for a tiny region (2–3 locations) and a character.
- An example test dispatches an action and asserts on the emitted events.

### M0A-22 · Scaffold `libs/battle` with its interfaces
`Type: Task` · `Parent: E-M0A-3` · `Priority: P0` · `Size: S` · `Labels: area:battle` · `Blocked by: M0A-16` · `agent-ready: yes` · `Owner: agent`

**Summary:** The package and types only. The Showdown implementation is M1.

**Acceptance criteria**
- `BattlePort` (start/choose/inject/subscribe), `BattleSpec` (including the reserved `turnGate`), `StatePatch`, `BattleEvent`, `ExternalActionResolver`, `ExternalActionContext`/`Outcome`, and `TurnDigest` types.
- Everything crossing these interfaces is serializable (a test round-trips through `JSON`).
- No Showdown dependency yet.

**Refs:** [14 § Package placement](../architecture/concepts/14-battle-system-and-showdown.md), [22](../architecture/concepts/22-adventure-log-and-narration.md)

---

## E-M0A-4 · Persistence & Data Basics
`Type: Epic` · `Priority: P0`

Make the data layer safe for real player state: transactions, constraints, a safe cache, and canon IDs.

### M0A-23 · Local Mongo as a single-node replica set
`Type: Task` · `Parent: E-M0A-4` · `Priority: P0` · `Size: S` · `Labels: area:infra` · `Blocked by: —` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- `docker-compose.yml` starts Mongo with `--replSet` and auto-initiates the set.
- `npm run setup` still works end to end. A test or script proves `session.withTransaction` succeeds locally.
- `.env.example` connection string updated.

### M0A-24 · Indexes and unique constraints
`Type: Task` · `Parent: E-M0A-4` · `Priority: P0` · `Size: S` · `Labels: area:shared-models` · `Blocked by: M0A-23` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- Unique `Server.serverId` and `User.userId`. `Location { regionId, ordinal }`.
- Indexes are declared in the schemas and created on startup (`autoIndex` in dev) or by a migration script (prod). Documented.
- `ensureServerInitialized` no longer creates duplicates under concurrent first use (test or reasoning in the PR).

**Refs:** [15](../architecture/concepts/15-persistence-caching-concurrency.md)

### M0A-25 · Cache policy: no shared mutable documents
`Type: Task` · `Parent: E-M0A-4` · `Priority: P0` · `Size: M` · `Labels: area:bot` · `Blocked by: —` · `agent-ready: no` · `Owner: senior`

**Acceptance criteria**
- The cache stores only immutable/plain data (`lean()` objects, frozen in dev). No hydrated Mongoose documents in the cache.
- Admin edits use targeted atomic updates (`$set` on paths) instead of mutate-cached-doc-then-`save()`.
- Existing admin menus keep working (manual test list in the PR).

**Refs:** [15](../architecture/concepts/15-persistence-caching-concurrency.md)

### M0A-26 · Canon species IDs (`speciesId`) on DexEntry, and references by ID
`Type: Task` · `Parent: E-M0A-4` · `Priority: P0` · `Size: M` · `Labels: area:shared-models` · `Blocked by: M0A-24` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- `DexEntry.speciesId` (Showdown `toID`) is unique and backfilled for all seed entries.
- Encounter slots and pokedex slots reference `speciesId` (string), not ObjectId. Seeds and DTOs updated.
- A migration script for existing databases.

**Refs:** [02](../architecture/concepts/02-identity-and-references.md), [12](../architecture/concepts/12-content-catalog-species-moves-items.md)

### M0A-27 · Sprite URL resolver and broken link fixes
`Type: Task` · `Parent: E-M0A-4` · `Priority: P2` · `Size: S` · `Labels: area:shared-models` · `Blocked by: —` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- `resolveSpriteUrl(species, { gen, game, palette, shiny, facing })` is the only way UI code gets sprite URLs. It falls back to the Showdown sprite CDN.
- Fix the 3 Gen 2 shiny entries that point at `imgur.com/<id>` pages (Weedle, Kakuna, Beedrill) to direct `i.imgur.com/<id>.png` images.
- Footprint/shape Bulbagarden hotlinks are listed in an issue for later mirroring (not fixed here).

**Refs:** [open-questions Q32](../architecture/open-questions.md)
