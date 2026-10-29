# M2: Arena Release (backlog draft, partial)

Only the **launch-readiness** epic is drafted so far. The rest of M2 (multi-user challenge flow, `/arena` hub, public battle messages, PvAI, alpha test) gets drafted with M1.

**Sequencing:** these issues start once the Arena works end to end in local development (late M1 / early M2). Hosting is the last step before going live, not a prerequisite for building. One optional exception: if you want private testers on the Arena before the public launch, pull M2-02 (containerize), M2-03 (Atlas), and M2-07 (staging) forward. Staging then doubles as the tester environment.

Refs: concept [21](../architecture/concepts/21-hosting-and-environments.md)

## External dependencies

### M2-00 · Tracking: FlowCord multi-user sessions (external)
`Type: Task` · `Parent: —` (M2 milestone) · `Priority: P0` · `Size: —` (work happens in FlowCord) · `Labels: area:bot, blocked` · `Blocked by: flowcord-dev/flowcord#55` · `agent-ready: no` · `Owner: owner`

**Summary:** FlowCord menus are single-person actionable today. The Arena needs multi-person menu interactions. The work is tracked in the FlowCord org by epic **[flowcord-dev/flowcord#55](https://github.com/flowcord-dev/flowcord/issues/55)** ("Multi-user session handling"; milestone v0.1.0-alpha.5; 0/7 sub-issues done as of Oct 2026). This issue blocks the Arena's challenge flow and battle UI issues (drafted with M1).

**What the Arena needs, mapped to the FlowCord sub-issues**

| Arena need | FlowCord coverage | Status |
|---|---|---|
| Shared public battle message, edited each turn, separate from any one interaction | [#56](https://github.com/flowcord-dev/flowcord/issues/56) shared adapter primitives (`acknowledgeInteraction`, `sendChannelMessage`, `editChannelMessage`) + [#57](https://github.com/flowcord-dev/flowcord/issues/57) Case 2 rolling shared render | ✅ Covered |
| Only participants can press battle controls (others get "not your menu") | #57 collector policy (any / allowlist / role) + [#59](https://github.com/flowcord-dev/flowcord/issues/59) Case 6 server-side permission checks | ✅ Covered |
| Each turn: both players choose privately, then the round resolves | [#60](https://github.com/flowcord-dev/flowcord/issues/60) Case 3 `ctx.diverge()`/`ctx.complete()` orchestrated rounds (its exit criterion is literally "a battle survives a dropout") | ✅ Covered (**core dependency**) |
| Turn timer (90s) → default move; 3 timeouts → forfeit | #60 per-participant timeouts, dropout `forfeit`/`substitute`/`pause`, `onParticipantDropout` | ✅ Covered via hooks. A "default action on timeout" (vs dropout) is worth confirming. |
| Challenge → accept/decline (direct challenge), or an open challenge anyone can take | [#58](https://github.com/flowcord-dev/flowcord/issues/58) Case 1 accumulate-then-act (approvals) · [#61](https://github.com/flowcord-dev/flowcord/issues/61) Case 7 first-response atomic claim | ✅ Covered |
| Spectators | Public channel message is inherently visible. #61 Case 5 `ctx.broadcast()` if per-spectator renders are wanted. | ✅ Covered (optional) |
| Tests without Discord | [#62](https://github.com/flowcord-dev/flowcord/issues/62) MenuHarness `asUser`, multi-session | ✅ Covered |
| **Updates pushed from outside an interaction** (AI opponent finished thinking, battle resolved asynchronously, timer fired) | Not specified. #57 doesn't define a refresh trigger from app code. | ⚠️ **Gap.** Confirm the orchestrator loop covers it, or add `session.refresh()` / an external-update API. |
| **Concurrent presses serialized within a session** | Not addressed in #57/#60. #61 Case 7 has atomic claim only. | ⚠️ **Gap.** Ask for per-session interaction serialization. |
| **Resume after bot restart:** re-attach a session to an existing shared message (`battleId` → message ID) once BattleService recovers the battle | Not addressed | ⚠️ **Gap.** Needs a way to start or adopt a session bound to an existing channel message. |
| Session state holds IDs (`battleId`), not live objects | Design guidance, not a FlowCord feature | ℹ️ PokeSandbox-side convention |
| Cross-shard coordination | Explicitly out of scope in #55 | ℹ️ Fine for MVP (single bot process). Revisit with sharding. |

**Minimum FlowCord set for the Arena:** #56, #57, #60 (core), plus #58 or #61-Case 7 for challenges. #59, #61-Case 5, and #62 are nice to have.

**Suggested comments to add on FlowCord** (owner; this session can't comment there):
- On #57/#60: "Can app code outside an interaction trigger a shared-message re-render or a round step (async AI turns, timers)? PokeSandbox's BattleService resolves turns asynchronously."
- On #60: "Please serialize interactions per session (two participants pressing at once)" and "support a default action on timeout distinct from dropout (Arena: random/default move, forfeit after 3)."
- On #55 (or a new sub-issue): "Session resume: adopt an existing channel message after a bot restart, so a recovered battle can continue in the same message."

**Acceptance criteria (for closing this tracking issue)**
- A released `@flowcord/core` includes #56, #57, #60, and #58 or #61-Case 7, with the gaps above resolved or explicitly worked around.
- PokeSandbox is upgraded to that version with no regressions in the existing admin menus.

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
