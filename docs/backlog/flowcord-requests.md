# FlowCord requests from PokeSandbox

FlowCord issues and comment drafts for [flowcord-dev/flowcord](https://github.com/flowcord-dev/flowcord), written while verifying the Arena boundary ([M2-00](m2-launch-readiness.md#m2-00--tracking-flowcord-and-the-arena-external-not-blocking), [14 § Multiplayer boundary](../architecture/concepts/14-battle-system-and-showdown.md#multiplayer-boundary-with-flowcord-decided-oct-2026-q34)). **FR-1–FR-3 are filed** (flowcord#105–#107, milestone `v0.1.0-alpha.3`, 2026-10-29). **The comment drafts (C-55, C-57, C-60, C-61) are not posted.** The owner decides whether to post them, then records the link in the table.

Code references are to `develop` @ `8cae106` (v0.1.0-alpha.2).

| Item | Kind | Milestone | For PokeSandbox | Posted |
|---|---|---|---|---|
| FR-1 | Feature (`feature: proposed`) | `v0.1.0-alpha.3` | Nice to have (M2-11) | [#105](https://github.com/flowcord-dev/flowcord/issues/105) |
| FR-2 | Feature (`feature: proposed`) | `v0.1.0-alpha.3` | Nice to have (M2-11, `/play`) | [#106](https://github.com/flowcord-dev/flowcord/issues/106) |
| FR-3 | Bug (`bug: unconfirmed`) | `v0.1.0-alpha.3` | Matters for `/play` (ephemeral default) | [#107](https://github.com/flowcord-dev/flowcord/issues/107) |
| C-55 | Comment on #55 | — | Context + Gap C | — |
| C-57 | Comment on #57 | — | Gap B + rejection reply | — |
| C-60 | Comment on #60 | — | Design notes | — |
| C-61 | Comment on #61 | — | Case 7 scope | — |

---

## Filed issues (source of truth)

FR-1–FR-3 were filed on 2026-10-29 with the fix designs from the boundary review. The issues are the source of truth. The drafts that used to be here were removed to avoid drift.

- **FR-1 → [flowcord#105](https://github.com/flowcord-dev/flowcord/issues/105)** "Start a session from a component interaction (button/select)". Accept a button or select press as a session's entry point, via one entry-interaction type that #69 and #65 can extend.
- **FR-2 → [flowcord#106](https://github.com/flowcord-dev/flowcord/issues/106)** "App-driven session refresh: redraw an open menu without an interaction". `session.refresh({ hard? })` wakes the parked loop through a cancellable wait (the first half of #51). It adds a render revision in custom IDs against stale presses and doesn't extend the inactivity timeout. `end()` is either deferred to #49 or shipped minimally. Overlaps #32 / PR #104.
- **FR-3 → [flowcord#107](https://github.com/flowcord-dev/flowcord/issues/107)** "Ephemeral sessions likely can't re-render 15 minutes after the slash command". Use the freshest interaction token for ephemeral edits and follow-ups, and end the session cleanly when none is valid. Labelled `bug: unconfirmed`, to be reproduced before fixing.

## C-55 · Comment on #55 (epic)

> Context from PokeSandbox, which is a likely first consumer. After reading the code and #56–#62, we're **not** putting the Arena's battle rounds on `diverge()`. Our battle service owns rounds and timers, because turns resolve outside interactions (AI workers, timers, restart recovery), and the timeout policy is a persisted game rule. Our shared surfaces (public battle message, challenges) will be plain discord.js handlers behind a port, so we can move onto FlowCord multi-user later.
>
> What would make that later move possible, roughly in order:
> 1. Start a session from a component interaction (#105).
> 2. App-driven `session.refresh()` (#106).
> 3. **Session adoption after restart:** start a session bound to an existing channel message (`{ channelId, messageId }`, no interaction) that re-renders immediately with fresh component IDs. Today IDs embed a per-process session ID, so a restarted bot can't take over its own shared messages. This depends on #56's channel-message primitives, and #72's serializable snapshot could be reused for it. Restart recovery is out of FlowCord's stated scope (session-persistence doc), so this could be documented as an app responsibility instead. Either answer is fine, but it would help to say which.
>
> Not needed by us: per-participant dropout policies for battles, or `ctx.broadcast`.

## C-57 · Comment on #57 (Case 2)

> Two design points from a battle/challenge use case:
> - **Presses while busy.** Today a session arms one `awaitMessageComponent` at a time, so presses that arrive during an action, or between a render and re-arming, are never acknowledged, and Discord shows "This interaction failed". That's tolerable for one user. With several users on one message it drops real input. Suggest a persistent collector per shared message that acks every permitted press immediately and queues it for serial dispatch.
> - **Rejecting non-permitted users.** The collector policy (any/allowlist/role) should come with a configurable ephemeral reply for users outside it ("This isn't your menu"), instead of a silent filter.

## C-60 · Comment on #60 (Case 3)

> Notes from a battle use case (we're keeping rounds in our own battle service, so treat these as design input only):
> - `ctx.complete(result)` already exists as "return a result from a sub-menu" (`openSubMenu` continuations). Using the same name for "participant finished this round" will be confusing. Consider `ctx.submit(result)` or similar.
> - Battles want a **default action on timeout** (play a default move, count consecutive timeouts, forfeit after N), which is different from dropout. If FlowCord adds per-participant timeouts, an `onTimeout(participant) → result` that *supplies* a result would cover it.
> - The orchestrator should be able to wait on **external** events as well as participant sessions (an AI's move, a game service resolving the round). Otherwise the round loop ends up duplicated in app code.

## C-61 · Comment on #61 (Case 7)

> For "atomic claim", it would help to state the scope: in-process only (one bot process, lost on restart). Apps that need first-claim-wins across restarts or processes must claim in their DB (a conditional update), and FlowCord's part would be the graceful-reject UX. "Valid claimer" checks (not the creator, eligibility predicate) look like a natural hook here.
