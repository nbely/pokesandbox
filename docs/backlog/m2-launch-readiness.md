# M2: Arena Release (backlog draft, partial)

Drafted so far: the FlowCord dependencies and the M2-13 upgrade, the **launch-readiness** epic (E-M2-1), and the **Arena multiplayer surface** epic (E-M2-2) that follows from the boundary in [14 § Multiplayer boundary](../architecture/concepts/14-battle-system-and-showdown.md#multiplayer-boundary-with-flowcord-decided-oct-2026-q34). The rest of M2 (`/arena` hub, PvAI setup, battle history, alpha test) gets drafted with M1.

**Sequencing:** E-M2-1 starts once the Arena works end to end in local development (late M1 / early M2). Hosting is the last step before going live, not a prerequisite for building. One optional exception: if you want private testers on the Arena before the public launch, pull M2-02 (containerize), M2-03 (Atlas), and M2-07 (staging) forward. Staging then doubles as the tester environment. E-M2-2 starts once BattleService (M1) can run a PvP battle headless.

Refs: concepts [14](../architecture/concepts/14-battle-system-and-showdown.md), [21](../architecture/concepts/21-hosting-and-environments.md)

## FlowCord dependencies

The Arena doesn't wait on FlowCord's multi-user work (Q34). Its shared surfaces are plain discord.js handlers behind `BattleSurface` (E-M2-2), and FlowCord runs the single-user `/arena` hub. The minimum FlowCord release is the one pinned today (`0.1.0-alpha.0`, or `alpha.2` after M2-13).

Three filed FlowCord issues would improve the Arena and `/play`. They're in milestone `v0.1.0-alpha.3`, the non-breaking release before the alpha.4 component overhaul:
- [flowcord#105](https://github.com/flowcord-dev/flowcord/issues/105): start a session from a component interaction (button/select). Lets M2-11's private prompt be a FlowCord menu.
- [flowcord#106](https://github.com/flowcord-dev/flowcord/issues/106): app-driven session refresh, to redraw an open menu without an interaction.
- [flowcord#107](https://github.com/flowcord-dev/flowcord/issues/107) (`bug: unconfirmed`): ephemeral sessions likely can't re-render 15 minutes after the slash command. Matters most for long `/play` sessions (Q2: ephemeral default).

To use them at launch, alpha.3 has to ship before M2-11 starts (mid-M2). If they slip past alpha.4, adopting them forces the alpha.4 migration first (see M2-13), so build M2-11 on plain handlers and revisit after launch.

### M2-13 · Upgrade `@flowcord/core` from `0.1.0-alpha.0` to `0.1.0-alpha.2`
`Type: Task` · `Parent: —` (M2 milestone; can be pulled forward any time) · `Priority: P2` · `Size: S` · `Labels: area:bot, dependencies` · `Blocked by: —` · `agent-ready: yes` · `Owner: agent`

**Summary:** Take the current FlowCord release so later asks (flowcord#105–#107) land on a recent base. Once alpha.3 ships with them, bump to alpha.3 instead. The alpha.2 breaking changes don't touch PokeSandbox: `ctx.navigateTo()` is removed (0 uses; the `navigateTo…` hits in `pokedexHelperFunctions.ts` are local names), the `openModal()` action is removed (0 uses), and `ActionRegistry` throws on duplicates (unused). One behavior change: inactivity timeouts now **replace** the message with the timeout text (see flowcord#94). `apps/bot` compiles as CommonJS, so the ESM type clash (flowcord#102) doesn't apply.

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
- Sentry (free tier) wired into the bot and webapp. Errors are tagged with environment, `journeyId`/`actionId`/`battleId` where available, and release version.
- An uptime check on the webapp plus a bot heartbeat (e.g. a health endpoint or a periodic ping), alerting the owner.

### M2-07 · Staging environment
`Type: Task` · `Parent: E-M2-1` · `Priority: P1` · `Size: M` · `Labels: area:infra` · `Blocked by: M2-01, M2-03` · `agent-ready: no` · `Owner: owner`

**Summary:** A second deployment of the bot and webapp with its own Discord application/bot token and test guild, using the `staging` database. Required before the Arena goes public.

**Acceptance criteria**
- The staging bot runs in a test guild and doesn't share tokens or DBs with prod.
- A documented "migration rehearsal": restore last night's prod dump into staging, then deploy the candidate release.

### M2-14 · Dependency security: clear Dependabot alerts and keep them cleared
`Type: Task` · `Parent: E-M2-1` · `Priority: P0` · `Size: M` · `Labels: area:infra, dependencies` · `Blocked by: M0A-04` · `agent-ready: no` · `Owner: senior`

**Summary:** `master` reports 226 Dependabot alerts (11 critical, 100 high, as of Oct 2026). Resolve them before the Arena goes public, and keep them resolved through the MVP release.

**Acceptance criteria**
- Every critical and high alert is fixed (upgrade, replace, or remove the package) or dismissed with a written reason (e.g. dev-only, not reachable). Moderate and low alerts are triaged, with fixes where an upgrade is safe.
- Dependabot security updates and grouped version updates are enabled (`.github/dependabot.yml`), with a weekly schedule.
- CI fails on new critical or high advisories in production dependencies (`npm audit --omit=dev --audit-level=high`, or the equivalent).
- Major upgrades that need code changes are split into their own issues rather than bundled here.
- Re-checked before the MVP release (M6).

**Refs:** [21](../architecture/concepts/21-hosting-and-environments.md)

---

## E-M2-2 · Arena Multiplayer Surface
`Type: Epic` · `Priority: P0`

The Discord side of PvP and PvAI, following [14 § Multiplayer boundary](../architecture/concepts/14-battle-system-and-showdown.md#multiplayer-boundary-with-flowcord-decided-oct-2026-q34). BattleService (M1) owns rounds, timers, and recovery. This epic owns challenges, the public battle message, participant checks, and private choice prompts, all restart-safe and behind a `BattleSurface` port. Scenario numbers below refer to the table in that section.

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

**Summary:** A participant pressing **Choose** gets an ephemeral prompt for their current request (moves, switches). Built on plain handlers, unless flowcord#105 (and ideally #106/#107) has shipped in a release, planned for alpha.3, before this starts (see [FlowCord dependencies](#flowcord-dependencies)).

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
