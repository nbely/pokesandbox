# FlowCord requests from PokeSandbox (drafts, not posted)

Draft issues and comments for [flowcord-dev/flowcord](https://github.com/flowcord-dev/flowcord), written while verifying the Arena boundary ([M2-00](m2-launch-readiness.md#m2-00--tracking-flowcord-and-the-arena-external-not-blocking), [14 § Multiplayer boundary](../architecture/concepts/14-battle-system-and-showdown.md#multiplayer-boundary-with-flowcord-recommended-oct-2026-pending-sign-off-q34)). **Nothing here has been posted.** The owner decides what to post, then records the link in the table.

Bodies follow FlowCord's issue forms (feature: *What problem / Proposed solution / Exit criteria*; bug: *What happened / Expected / Reproduce / Version / Anything else*). Code references are to `develop` @ `8cae106` (v0.1.0-alpha.2).

| Draft | Kind | Target | For PokeSandbox | Posted |
|---|---|---|---|---|
| FR-1 | Feature (new) | Phase 3, non-breaking | Nice to have (M2-11) | — |
| FR-2 | Feature (new) | Phase 3, non-breaking | Nice to have (M2-11, `/play`) | — |
| FR-3 | Bug (new) | Next patch | Matters for `/play` (ephemeral default) | — |
| C-55 | Comment on #55 | — | Context + Gap C | — |
| C-57 | Comment on #57 | — | Gap B + rejection reply | — |
| C-60 | Comment on #60 | — | Design notes | — |
| C-61 | Comment on #61 | — | Case 7 scope | — |

---

## FR-1 · Start a session from a component interaction (button/select)

### What problem does this solve?
Sessions can only start from a slash command: `FlowCord.handleInteraction`, `MenuEngine.createSession`, `MenuSession`, and `DiscordAdapter` all take a `ChatInputCommandInteraction`. A common multi-user pattern is a public message with a button like "Make your move" or "Join" that opens a private, per-user menu. Discord only allows an ephemeral message in reply to that user's own interaction, so the press itself has to be the session's entry point. #69 widens entry to context-menu commands but not to components.

### Proposed solution
Accept `ButtonInteraction` / `AnySelectMenuInteraction` as an entry interaction (an overload or `handleComponentEntry(interaction, menuName, options?, interactionOptions?)`). The interaction has to be a non-FlowCord custom ID, or one the app has claimed. `DiscordAdapter` already uses only `deferReply`/`editReply`/`followUp` on the entry interaction, and component interactions support all three, so most of this is type widening (`_commandInteraction` → a `RepliableEntryInteraction` union) plus tests. `ctx.interaction` is already typed `Interaction`. Expose the triggering custom ID and message on `ctx`, as #69 proposes for context-menu targets.

**Exit criteria:** a button press on a non-session message opens an ephemeral FlowCord session for the presser. Covered in `DiscordAdapter` and `SimulatedAdapter` tests. Roadmap: Phase 3 (independent of Cases 1–8).

## FR-2 · App-driven refresh and end for active sessions

### What problem does this solve?
A session re-renders only inside its own loop, after an interaction (`processMenus()` → `renderCurrentMenu()`, which is private). App code that learns about a change outside an interaction has no way to update an open menu. Examples: a background job finishing, a game turn resolving, a timer firing, a DB change. `getSession(id).hardRefresh()` only sets a flag for the next loop pass, and the loop is parked in `awaitMessageComponent`. Ending a session from outside isn't possible either (#49 proposes `ctx.end(reason)`, which needs a `ctx`). #57's shared menus fed by external state need the same primitive.

### Proposed solution
- `session.refresh({ hard?: boolean })`: re-run the render cycle for the current menu (re-running the factory first if `hard`) and edit the active message. Safe to call while the loop is waiting for input, because the collector is bound to the message and survives an edit. Serialized with in-flight actions by a per-session mutex, so it never interleaves with a dispatch.
- `session.end(reason)`: the #49 terminal path, callable from app code.
- Reachable via `flowcord.getSession(id)`. Apps store the session ID (or get it from a `ctx.session.id` they recorded) and call it from their event handlers.

**Exit criteria:** an external call re-renders an idle session and ends a session, with no interaction. A refresh during an action runs after the action. Roadmap: Phase 3 (foundation for #57).

## FR-3 · Ephemeral sessions likely can't re-render 15 minutes after the slash command

### What happened?
Found by reading the code; **not yet reproduced against Discord.** `DiscordAdapter._editEphemeralMessage()` always edits with the **entry** interaction's token: `this._commandInteraction.editReply(...)`, or a webhook PATCH with `this._commandInteraction.token` for follow-ups. `MenuSession.handleComponentInteraction()` calls `deferUpdate()` on every non-modal component interaction, so `sendPayload()` never takes the `_lastComponentInteraction.update()` path after an action. Every later ephemeral render goes through the entry token. Discord interaction tokens expire after 15 minutes, so an ephemeral session that's still in use after 15 minutes should fail to render, even though the user just pressed a button.

### What did you expect?
Renders after a component interaction use that interaction's token (`interaction.editReply()` after `deferUpdate()` edits the message the component is on), so a session stays usable as long as the user keeps interacting.

### How can we reproduce it?
An ephemeral menu with a button that increments a counter. Press it every few minutes. After 15 minutes from the slash command, the next press should fail to update the message (expect a `50027 Invalid Webhook Token` from the REST call).

### FlowCord version
0.1.0-alpha.2

### Anything else?
Non-ephemeral messages are unaffected (`message.edit` uses the bot token). Suggested fix: track the latest repliable interaction in `DiscordAdapter` (set in `awaitComponent`/`awaitModal`) and use it for `editReply` and follow-up edits, falling back to the entry interaction. `sendTerminalPayload()`'s ephemeral path has the same issue.

---

## C-55 · Comment on #55 (epic)

> Context from PokeSandbox, which is a likely first consumer. After reading the code and #56–#62, we're **not** putting the Arena's battle rounds on `diverge()`. Our battle service owns rounds and timers, because turns resolve outside interactions (AI workers, timers, restart recovery), and the timeout policy is a persisted game rule. Our shared surfaces (public battle message, challenges) will be plain discord.js handlers behind a port, so we can move onto FlowCord multi-user later.
>
> What would make that later move possible, roughly in order:
> 1. Start a session from a component interaction (FR-1 link).
> 2. App-driven `session.refresh()` / `session.end()` (FR-2 link).
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
