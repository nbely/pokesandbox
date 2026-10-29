# M2: Arena Release (backlog draft, partial)

Drafted so far: the FlowCord dependency (M2-00), the **launch-readiness** epic (E-M2-1), and the **Arena multiplayer surface** epic (E-M2-2) that follows from the boundary in [14 § Multiplayer boundary](../architecture/concepts/14-battle-system-and-showdown.md#multiplayer-boundary-with-flowcord-recommended-oct-2026-pending-sign-off-q34). The rest of M2 (`/arena` hub, PvAI setup, battle history, alpha test) gets drafted with M1.

**Sequencing:** E-M2-1 starts once the Arena works end to end in local development (late M1 / early M2). Hosting is the last step before going live, not a prerequisite for building. One optional exception: if you want private testers on the Arena before the public launch, pull M2-02 (containerize), M2-03 (Atlas), and M2-07 (staging) forward. Staging then doubles as the tester environment. E-M2-2 starts once BattleService (M1) can run a PvP battle headless.

Refs: concepts [14](../architecture/concepts/14-battle-system-and-showdown.md), [21](../architecture/concepts/21-hosting-and-environments.md)

## External dependencies

### M2-00 · Tracking: FlowCord and the Arena (external, not blocking)
`Type: Task` · `Parent: —` (M2 milestone) · `Priority: P2` · `Size: —` (work happens in FlowCord) · `Labels: area:bot` · `Blocked by: —` · `agent-ready: no` · `Owner: owner`

**Summary:** FlowCord menus are single-person actionable. The earlier plan put the Arena's challenge flow and battle UI on FlowCord epic **[flowcord-dev/flowcord#55](https://github.com/flowcord-dev/flowcord/issues/55)** ("Multi-user session handling"). After reading the FlowCord code and the full text of #55–#62, the recommendation (Q34) is that the Arena **doesn't depend on #55**. BattleService owns rounds and timers. The shared surfaces are plain discord.js handlers behind a `BattleSurface` port (E-M2-2). FlowCord stays single-user for the `/arena` hub. This issue tracks the optional FlowCord asks and the eventual move of the shared surfaces onto FlowCord. If Q34 is rejected, it goes back to `P0`, `blocked`, and blocked by #55 plus the gaps below.

**State of #55 (verified 2026-10-29)**
- Epic and all 7 sub-issues (#56–#62) are open, with **0 comments** on any of them. Last updated 2026-06-10. Milestone `v0.1.0-alpha.5`.
- **No multi-user code exists** on `develop` (v0.1.0-alpha.2) or any other branch. The bodies are short proposals, not specs.
- Alpha.5 comes after `v0.1.0-alpha.3` (6 open, mostly tooling and docs) and `v0.1.0-alpha.4` (16 open, including the **breaking** component-model overhaul #43/#44 and the behavior suite #48). The `v0.1.0` milestone (due 2026-09-30) is still open.

**Verified mapping** (FlowCord `develop` @ `8cae106` + full issue text)

| Arena need | Earlier assumption | Verified | Verdict |
|---|---|---|---|
| Shared public message edited each turn | #56 + #57 Case 2: ✅ Covered | **Not implemented.** #56 is three adapter-internal method names (`DiscordAdapter`/`SimulatedAdapter`), not an app-facing API. #57 adds "a shared-message-ID concept on the session". Neither lets app code edit the message without an interaction: `processMenus()` renders only inside its loop, and `renderCurrentMenu()` is private. | ❌ Not covered. Arena: projector (M2-10). |
| Only participants act; others get "not your battle" | #57 collector policy + #59: ✅ Covered | Today `DiscordAdapter.awaitComponent` filters to one `userId`. Other users' presses are never acknowledged, so Discord shows "This interaction failed", not "not your menu". #57 says "any/allowlist/role" with no rejection reply. #59 lists **both** options ("Either `renderFor` … or a `visible` predicate"). Neither has been chosen. | ❌ Not decided. Arena: stable-ID router (M2-08). |
| Players choose privately, then the round resolves | #60 `diverge`/`complete`: ✅ Covered (**core**) | Proposal only. A `Promise.all` over in-memory participant sessions that resolves on button presses. It doesn't wake on BattleService events (AI worker, timers), can't survive a restart, and `ctx.complete(result)` already means "return from sub-menu" in today's API. | ❌ Wrong fit. Rounds belong to BattleService. Prompts in M2-11. |
| 90s timeout → default move; 3 consecutive → forfeit | #60 dropout hooks: ✅ via hooks | #60 has per-participant timeouts with dropout `forfeit`/`substitute`/`pause` only. No default action, no consecutive count. FlowCord timeouts are collector timers that reset on restart. | ❌ Not covered. BattleService (M1 timer item, see 14 § Ownership). |
| Direct challenge (only the challenged player responds) | #58 Case 1 approvals: ✅ Covered | #58 is **accumulate-then-render** (N responses / quorum / time window, "acknowledge but don't re-render yet"). That's for polls and votes. A direct challenge is one decision by one non-owner user, which needs #57's allowlist, not #58. | ❌ Mis-mapped. Arena: `Challenge` record (M2-09). |
| Open challenge (first valid accepter wins) | #61 Case 7: ✅ Covered | One clause: "atomic claim + graceful reject". At best it's in-process. Not restart-safe, and it doesn't define "valid" (own challenge, no legal team, already battling, expired). | ⚠️ Thin. Arena: DB conditional update (M2-09). |
| Spectators | Public message; #61 `ctx.broadcast` optional | Correct that the public message suffices. `ctx.broadcast(payload, userIds)` sends per-user read-only renders, which isn't needed. Spectator presses need an explicit reply (see row 2). | ✅ No FlowCord need. |
| Tests without Discord | #62 MenuHarness `asUser`: ✅ Covered | #62 (`asUser`, session registry, `awaitConvergence`, `rendersFor`) tests *FlowCord* multi-user flows. With Q34, Arena multi-user logic is tested headless in PokeSandbox (BattleService + fake `Clock` + fake `BattleSurface`). Today's single-user `MenuHarness` covers the `/arena` hub. | ℹ️ Only needed if FlowCord multi-user is adopted. |
| **Gap A:** updates pushed from outside an interaction | ⚠️ Gap | **Real.** No public render/refresh API. `getSession(id).hardRefresh()` only sets a flag for the next loop pass, and the loop is parked in `awaitMessageComponent`. Single-player battles can use the await-in-action pattern instead (see 14). | Real. Draft FR-2. Not blocking. |
| **Gap B:** concurrent presses handled one at a time | ⚠️ Gap | **Half real.** A session is serial by construction (one collector armed at a time), so there's no double dispatch. But presses that land while an action runs, or between render and re-arm, are **dropped** (never acked → "interaction failed"). In a shared session that would lose choices. | Arena: BattleService per-battle queue + `rqid`. Draft comment on #57. |
| **Gap C:** adopt an existing message after restart | ⚠️ Gap | **Real.** Sessions are process memory. Custom IDs embed a random session ID (`fc:{sessionId}:…`), so old buttons match nothing after a restart. Sessions can only start from a `ChatInputCommandInteraction`, with first render via `editReply`. #72 (snapshot/rehydrate, alpha.6) is for HMR, not restarts. | Arena: stable IDs + stored `messageId` (M2-10). Draft comment on #55. |
| **Gap D (new):** start a session from a button press | Not listed | A private prompt must be opened from the player's press on the public message, because Discord can't push an ephemeral without that user's interaction. `handleInteraction`/`MenuSession` accept only `ChatInputCommandInteraction`. #69 widens entry to context-menu commands only. | Real. Draft FR-1. Not blocking (plain handler fallback). |
| **Gap E (new):** ephemeral sessions past 15 minutes | Not listed | `DiscordAdapter` edits ephemerals with the **entry** interaction's token (`editReply` / webhook PATCH), even after a later component interaction. So an ephemeral session likely can't re-render 15 min after its slash command. Found by reading the code, not reproduced. Matters most for long `/play` sessions (Q2: ephemeral default). | Likely bug. Draft FR-3. Reproduce first. |
| Session state holds IDs, not live objects | ℹ️ Convention | Unchanged. | ℹ️ PokeSandbox convention. |
| Cross-shard coordination | ℹ️ Out of scope in #55 | Unchanged (#79 documents it). | ℹ️ Fine for MVP. |

**Minimum FlowCord release for the Arena:** none beyond what's pinned. The Arena ships on `0.1.0-alpha.0`, or on `alpha.2` after M2-13. Nice to have, in order: FR-1 (component entry), FR-2 (app-driven refresh/end), FR-3 (ephemeral token fix). To use them at launch, they need to ship on a **non-breaking** release (alpha.3 line) before M2-11 starts, which is mid-M2. If they only arrive with alpha.5, adopting them forces the alpha.4 migration first (M2-13), so build M2-11 on plain handlers and revisit after launch.

**Draft FlowCord text (not posted):** [`flowcord-requests.md`](flowcord-requests.md): three feature/bug drafts (FR-1–FR-3) and comments for #55, #57, #60, #61. The owner posts them.

**Acceptance criteria (for closing this tracking issue)**
- Q34 is answered. If rejected, this issue is re-scoped to blocking, and the mapping above becomes the FlowCord requirements list.
- Each FR draft is posted, declined, or parked, with the outcome linked here.
- If the shared surfaces move to FlowCord: a FlowCord-backed `BattleSurface` passes the E-M2-2 scenario tests, with no changes to BattleService or challenge records.

**Fallback (now the primary plan for shared surfaces):** plain discord.js handlers on top of BattleService. This works, and it migrates to FlowCord later without rewriting orchestration, because rounds, timers, challenges, and recovery live outside the UI and the surface sits behind `BattleSurface`. Only the surface implementation and the prompt handlers would be rewritten. The view builders carry over.

### M2-13 · Upgrade `@flowcord/core` from `0.1.0-alpha.0` to `0.1.0-alpha.2`
`Type: Task` · `Parent: —` (M2 milestone; can be pulled forward any time) · `Priority: P2` · `Size: S` · `Labels: area:bot, dependencies` · `Blocked by: —` · `agent-ready: yes` · `Owner: agent`

**Summary:** Take the current FlowCord release so later asks (FR-1–FR-3) land on a recent base. The alpha.2 breaking changes don't touch PokeSandbox: `ctx.navigateTo()` is removed (0 uses; the `navigateTo…` hits in `pokedexHelperFunctions.ts` are local names), the `openModal()` action is removed (0 uses), and `ActionRegistry` throws on duplicates (unused). One behavior change: inactivity timeouts now **replace** the message with the timeout text (see flowcord#94). `apps/bot` compiles as CommonJS, so the ESM type clash (flowcord#102) doesn't apply.

**Acceptance criteria**
- `@flowcord/core` pinned to `0.1.0-alpha.2`. Typecheck, lint, and tests pass.
- Manual pass over the admin menus (server, region, pokedex, progression, locations). Timeout behavior is checked, and `setTimeoutMessage()` or a global `timeoutMessage` is set if the default text is unwanted.
- The PR notes that `client.flowcord.routeComponentInteraction()` in `interactionCreate.ts` is a no-op (flowcord#41). Leave the call until #41 decides its fate.

**Not in scope:** the **alpha.4** migration (flowcord#43/#44: one `setComponents()` replaces `setButtons`/`setSelectMenu`/`setLayout`, and reserved buttons are reworked). It touches about 15 `setButtons`/`setSelectMenu` call sites across the 23 files that import FlowCord. Schedule it after M0B-17–19, which touch the same admin menus, and not during the Arena launch window. Draft it when alpha.4 is released.

**Refs:** [flowcord CHANGELOG 0.1.0-alpha.2](https://github.com/flowcord-dev/flowcord/blob/develop/packages/core/CHANGELOG.md)


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

---

## E-M2-2 · Arena Multiplayer Surface
`Type: Epic` · `Priority: P0`

The Discord side of PvP and PvAI, following [14 § Multiplayer boundary](../architecture/concepts/14-battle-system-and-showdown.md#multiplayer-boundary-with-flowcord-recommended-oct-2026-pending-sign-off-q34). BattleService (M1) owns rounds, timers, and recovery. This epic owns challenges, the public battle message, participant checks, and private choice prompts, all restart-safe and behind a `BattleSurface` port. Scenario numbers below refer to the table in that section.

**Depends on M1 BattleService items** (drafted with M1, contract in 14 § Ownership): `choose` with `rqid` validation and a per-battle queue; per-side persisted deadlines with default-on-timeout and a consecutive-timeout forfeit; `recover()` re-arming timers with a fresh window and emitting `battleRecovered`.

### M2-08 · Arena interaction router with stable custom IDs
`Type: Task` · `Parent: E-M2-2` · `Priority: P0` · `Size: S` · `Labels: area:bot` · `Blocked by: —` · `agent-ready: yes` · `Owner: junior`

**Summary:** One handler for every Arena component, routed before FlowCord in `interactionCreate.ts`. IDs encode only persistent data, so buttons keep working across restarts.

**Acceptance criteria**
- Custom ID scheme `arena:<verb>:<recordId>[:<extra>]` (≤ 100 chars), with a parser and unit tests. Verbs cover at least `accept`, `decline`, `cancel`, `choose`, `forfeit`, and prompt choices.
- The router loads the `Challenge`/`ArenaMatch` record and checks that the presser may act. Everyone else gets an ephemeral reply ("This isn't your battle" / "This challenge isn't for you") within 3s. No press is ever left unacknowledged.
- Unknown or stale records get an ephemeral "This battle has ended" reply, and the message's components are stripped.

**Refs:** [14 § Ownership](../architecture/concepts/14-battle-system-and-showdown.md#ownership)

### M2-09 · Challenges: direct and open, atomic claim, expiry
`Type: Feature` · `Parent: E-M2-2` · `Priority: P0` · `Size: M` · `Labels: area:bot, area:shared-models` · `Blocked by: M2-08` · `agent-ready: yes` · `Owner: junior`

**Summary:** A `Challenge` record (`challengerId`, `targetUserId?`, `formatId`, `teamId`, `channelId`, `messageId`, `status: open|claimed|declined|cancelled|expired`, `expiresAt`) and the public challenge message. The `/arena` hub (FlowCord) creates challenges. Responses go through M2-08.

**Acceptance criteria**
- Accept is a single conditional update (`status: 'open'`, `expiresAt > now`, and for direct challenges `targetUserId` = presser). Exactly one of N concurrent accepters wins (a test fires parallel accepts). Losers get "Already taken".
- Rejected with a clear message: the challenger accepting their own challenge, accepters with no team that's legal for the format, and players already in an active battle.
- Expiry after 5 minutes uses the game host scheduler, which edits the message to "Expired" and strips buttons. On boot, open challenges are swept (expired → edited) or re-armed. Correctness doesn't depend on the timer firing.
- Decline (direct only) and cancel (challenger only) work. A deleted challenge message doesn't crash the expiry job.
- A claimed challenge starts the battle through `BattlePort.start` and hands off to M2-10.

**Refs:** [14 § Acceptance scenarios](../architecture/concepts/14-battle-system-and-showdown.md#acceptance-scenarios) (1, 2)

### M2-10 · Public battle message projector (`BattleSurface`)
`Type: Feature` · `Parent: E-M2-2` · `Priority: P0` · `Size: M` · `Labels: area:bot` · `Blocked by: M2-08` · `agent-ready: no` · `Owner: senior`

**Summary:** Subscribes to BattleService events and keeps one public channel message per match current. It's the only writer of that message. Defines the `BattleSurface` port and the pure `BattleView → Components v2` builders.

**Acceptance criteria**
- An `ArenaMatch` record (`battleId`, `challengeId?`, `guildId`, `channelId`, `messageId`, `players[]`) in `apps/bot`. `libs/battle` holds no Discord IDs.
- One message edit per resolved turn (coalesced), showing both sides, HP, the last turn's log, and the current deadline as a Discord relative timestamp. Buttons are **Choose** and **Forfeit**.
- On `battleRecovered`, the stored message is re-rendered in place. If the message is gone, a new one is posted and `messageId` updated.
- View builders are pure functions with snapshot tests. A fake `BattleSurface` lets scenario tests run without Discord.
- Rate-limit errors back off and retry without dropping the final state.

**Refs:** [14 § Ownership](../architecture/concepts/14-battle-system-and-showdown.md#ownership) (scenarios 3, 6, 8)

### M2-11 · Private choice prompts
`Type: Feature` · `Parent: E-M2-2` · `Priority: P0` · `Size: M` · `Labels: area:bot` · `Blocked by: M2-08, M2-10` · `agent-ready: no` · `Owner: senior`

**Summary:** A participant pressing **Choose** gets an ephemeral prompt for their current request (moves, switches). Built on plain handlers, unless FlowCord FR-1 ships on a non-breaking release before this starts (see M2-00).

**Acceptance criteria**
- The prompt reads the side's current request from BattleService. Prompt custom IDs carry `rqid`. A lock-in calls `choose(…, rqid)` and updates the prompt in the same interaction ("Locked in: Thunderbolt. Waiting for opponent…").
- A double press, or a press on a stale prompt, gets "Already locked in" / "That turn is over". It never sends a second choice (scenario 7).
- Best effort: when the next request arrives, the player's last prompt is edited to the new options using that interaction's token (in memory, < 15 min). Pressing **Choose** on the public message always works as a fallback, including after a restart.
- PvAI uses the same prompt, with no timer. The prompt updates when the AI's turn resolves (scenario 5).

**Refs:** [14 § Acceptance scenarios](../architecture/concepts/14-battle-system-and-showdown.md#acceptance-scenarios) (3, 5, 7)

### M2-12 · Arena scenario tests and a restart drill
`Type: Task` · `Parent: E-M2-2` · `Priority: P1` · `Size: S` · `Labels: area:bot, area:battle` · `Blocked by: M2-09, M2-10, M2-11` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- Headless tests for scenarios 1–8, using BattleService with a fake `Clock`/scheduler and the fake `BattleSurface`: 90s timeout → default move, 3 consecutive → forfeit, the counter resets on a real choice, parallel accepts, and spectator presses.
- A restart test: stop the game host mid-turn, recover, and assert the same `messageId` is edited, deadlines are fresh, and the interrupted window isn't counted as a timeout.
- A manual drill on the dev server, documented in the PR: kill the bot mid-battle, restart, and finish the battle in the same message.

**Refs:** [14 § Acceptance scenarios](../architecture/concepts/14-battle-system-and-showdown.md#acceptance-scenarios)
