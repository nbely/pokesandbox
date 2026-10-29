# M2: Arena Release (backlog draft, partial)

Only the **launch-readiness** epic is drafted so far. The rest of M2 (multi-user challenge flow, `/arena` hub, public battle messages, PvAI, alpha test) gets drafted with M1.

**Sequencing:** these issues start once the Arena works end to end in local development (late M1 / early M2). Hosting is the last step before going live, not a prerequisite for building. One optional exception: if you want private testers on the Arena before the public launch, pull M2-02 (containerize), M2-03 (Atlas), and M2-07 (staging) forward. Staging then doubles as the tester environment.

Refs: concept [21](../architecture/concepts/21-hosting-and-environments.md)

## External dependencies

### M2-00 · Tracking: FlowCord multi-user sessions (external)
`Type: Task` · `Parent: —` (M2 milestone) · `Priority: P0` · `Size: —` (work happens in the FlowCord repo) · `Labels: area:bot, blocked` · `Blocked by: FlowCord issue (to be created)` · `agent-ready: no` · `Owner: owner`

**Summary:** FlowCord menus are single-person actionable today. The Arena needs multi-person menu interactions. The work is built and released in the FlowCord repo. This issue tracks it and blocks the Arena's challenge flow and battle UI issues (drafted with M1).

**Capabilities PokeSandbox needs from FlowCord** (draft spec for the FlowCord issue):
1. **Multi-participant sessions:** an initiator plus participants added by invitation (user select) or by joining (button), optionally time-limited sign-up.
2. **Per-participant permissions:** components declare who may act (a specific participant, any participant, initiator only). Others get a polite ephemeral "not your turn/menu".
3. **Shared public message + private sub-flows:** one shared message (e.g. the battle state in a public channel, viewable by spectators) plus **per-participant ephemeral sub-flows** (e.g. each player's move/switch prompt).
4. **Externally driven updates:** the app can push a refresh into a live session from outside a user interaction (e.g. BattleService finished a turn, the opponent chose, a timer expired).
5. **Session state holds IDs, not live objects:** e.g. `battleId`, with the battle owned by `libs/battle` (no cloning or serializing of streams in session state).
6. **Concurrency:** interactions within one session are serialized, so simultaneous presses by two participants can't race.
7. **Timeouts per participant and per session,** with a hook so the app can apply defaults (the Arena's 90s turn timer).

**Fallback if FlowCord slips:** the challenge prompt and per-turn choice prompts can be built with plain discord.js interaction handlers on top of BattleService (same engine/battle ports), then migrated to FlowCord sessions later. It's less consistent UX code, but it unblocks the Arena.

**Acceptance criteria (for closing this tracking issue)**
- A released `@flowcord/core` version provides capabilities 1–7 (or an agreed subset), with docs/examples.
- PokeSandbox is upgraded to that version with no regressions in the existing admin menus.


---

## E-M2-1 · Launch Readiness: Hosting & Operations
`Type: Epic` · `Priority: P0`

Everything needed to run the bot and webapp for real players: a managed host for the always-on bot and the webapp, MongoDB Atlas with backups, deploy pipelines, monitoring, and a staging environment. Scheduled **at the end of the Arena track**, once the Arena works locally.

### M2-01 · Choose the host and provision prod app services
`Type: Task` · `Parent: E-M2-1` · `Priority: P0` · `Size: M` · `Labels: area:infra` · `Blocked by: M2-02` · `agent-ready: no` · `Owner: owner`

**Summary:** Decide between the offered family host and a managed host (Railway/Fly/Render class). Provision an always-on bot service and a webapp service.

**Acceptance criteria**
- The host supports always-on Node processes (Discord gateway + in-memory battles) and Docker images.
- The prod bot and webapp run from images built in CI, with secrets in the host's secret store.
- The webapp has a domain with TLS. The Discord OAuth redirect URIs are updated.
- Cost and plan details are recorded in [21](../architecture/concepts/21-hosting-and-environments.md).

**Refs:** [21](../architecture/concepts/21-hosting-and-environments.md)

### M2-02 · Containerize the bot and webapp
`Type: Task` · `Parent: E-M2-1` · `Priority: P0` · `Size: M` · `Labels: area:infra` · `Blocked by: —` · `agent-ready: yes` · `Owner: agent`

**Summary:** Production Dockerfiles for `apps/bot` and `apps/webapp` (multi-stage, Nx build), plus a `docker-compose.yml` profile that runs both locally against the dev Mongo.

**Acceptance criteria**
- `docker build` produces runnable images for both apps. Images run as non-root. Final images contain no dev dependencies.
- The local compose profile starts Mongo (see M0A-16), the bot, and the webapp, using `.env`.
- The README documents the commands.

### M2-03 · Atlas setup: prod, staging, and dev databases
`Type: Task` · `Parent: E-M2-1` · `Priority: P0` · `Size: S` · `Labels: area:infra` · `Blocked by: —` · `agent-ready: no` · `Owner: owner`

**Acceptance criteria**
- An Atlas free cluster with separate `prod` and `staging` databases. Developers use local Mongo.
- A least-privilege DB user per environment. The network allowlist is restricted to the host egress where possible.
- Connection strings are stored only in the host's secret store and GitHub secrets.

### M2-04 · Nightly backups with a tested restore
`Type: Task` · `Parent: E-M2-1` · `Priority: P0` · `Size: M` · `Labels: area:infra` · `Blocked by: M2-01, M2-03` · `agent-ready: no` · `Owner: senior`

**Summary:** Atlas Free has no backups, so run a scheduled `mongodump` of `prod` to free-tier object storage (e.g. R2), with retention.

**Acceptance criteria**
- Runs nightly with 14–30 day retention. Failures alert the owner.
- A documented restore procedure, exercised once by restoring into `staging`.
- Backup credentials are scoped to a single bucket.

### M2-05 · Deploy pipeline
`Type: Task` · `Parent: E-M2-1` · `Priority: P1` · `Size: M` · `Labels: area:infra` · `Blocked by: M0A-04, M2-01, M2-02` · `agent-ready: no` · `Owner: senior`

**Acceptance criteria**
- Version tag `v*` → build, push images, deploy prod.
- Merge to `master` → deploy staging, once M2-07 exists. Until then, build only.
- Rollback = redeploying the previous tag. Documented.
- Slash-command registration runs as a deploy step (not on every bot boot).

### M2-06 · Error monitoring and uptime checks
`Type: Task` · `Parent: E-M2-1` · `Priority: P1` · `Size: S` · `Labels: area:infra` · `Blocked by: M2-01` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- Sentry (free tier) wired into the bot and webapp. Errors are tagged with environment, `characterId`/`actionId`/`battleId` where available, and release version.
- An uptime check on the webapp plus a bot heartbeat (e.g. a health endpoint or a periodic ping), alerting the owner.

### M2-07 · Staging environment
`Type: Task` · `Parent: E-M2-1` · `Priority: P1` · `Size: M` · `Labels: area:infra` · `Blocked by: M2-01, M2-03` · `agent-ready: no` · `Owner: owner`

**Summary:** A second deployment of the bot and webapp with its own Discord application/bot token and test guild, using the `staging` database. Required before the Arena goes public.

**Acceptance criteria**
- The staging bot runs in a test guild and doesn't share tokens or DBs with prod.
- A documented "migration rehearsal": restore last night's prod dump into staging, then deploy the candidate release.
