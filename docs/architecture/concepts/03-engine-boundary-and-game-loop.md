# 03: Engine Boundary & Game Loop

> **TL;DR:** Put all game rules in a Discord-agnostic **`libs/engine`** package with one entry point: `dispatch(journeyId, action) → { state', events[] }`. The bot (and later the webapp) are *clients* that turn button presses into actions and render the resulting events. Long-running interactions (dialogue, choices, battles) are **persisted state on the journey**, not FlowCord session memory.

**MVP impact:** Very high · **Cost to change later:** Very high

## Why it matters

Today the "domain logic" is inside FlowCord menu handlers. That works for admin CRUD. It breaks down for gameplay because:

- **Multiple clients.** Your roadmap has the webapp becoming a play surface, AI judges, and staff ops. Rules duplicated across clients diverge.
- **Restarts.** A FlowCord session is in-memory. If the bot restarts mid-gym-battle or mid-dialogue, the player's progress must survive. The source of truth must be the DB.
- **Concurrency.** Players double-click, open two menus, or trade while battling. Rules need one serialized choke point per journey.
- **Testing.** "Can a level-5 Charmander beat Brock with the AI on hard?" and "is Route 3 reachable without Cut?" must run headless.
- **AI trainers and playtesting bots** should drive the same engine that players do.

## Design

```
apps/bot ─┐                     ┌─► repositories (Mongo)        ◄── state
apps/web ─┼─► libs/engine ──────┼─► ContentProvider (releases)  ◄── content
tests   ──┘   (pure TS)         ├─► BattleService (Showdown)
              dispatch(action)  └─► Rng, Clock (injected)
              → GameEvent[]
```

```ts
type GameAction =
  | { type: 'travel'; to: ContentKey }
  | { type: 'explore'; method: EncounterMethodId }      // walk in grass, fish, surf…
  | { type: 'interact'; target: ContentKey }            // talk to NPC / use object
  | { type: 'scriptInput'; choice?: string }            // advance dialogue / pick option
  | { type: 'battleChoice'; battleId: string; choice: string }
  | { type: 'useItem'; item: ItemId; target?: PokemonRef }
  | { type: 'shop'; shop: ContentKey; buy?: …; sell?: … }
  | { type: 'party'; op: 'reorder' | 'deposit' | 'withdraw' | 'release'; … }
  | …;

type GameEvent =
  | { type: 'enteredLocation'; location: ContentKey; from?: ContentKey; via: 'walk' | TransportNetworkKey }
  | { type: 'dialogue'; speaker?: string; text: string; awaitsInput: boolean }
  | { type: 'choicePrompt'; options: …[] }
  | { type: 'battleStarted'; battleId: string; … }
  | { type: 'itemsChanged'; … } | { type: 'pokemonGranted'; … } | { type: 'progressChanged'; … }
  | { type: 'actionRejected'; reason: ConditionExplanation };
```

**Rules the engine owns:** condition evaluation, effect application, the script VM, travel/encounter resolution, the battle lifecycle (via BattleService), EXP/level/evolution, the economy.
**The bot owns:** turning events into embeds/components, FlowCord navigation, permissions, rate limiting.

### The "mode" state machine
At any moment a journey is in exactly one **mode**, persisted on the journey:

```
overworld ──interact/trigger──► script(pc, locals) ──battle step──► battle(battleId)
    ▲                               │  ▲                                   │
    └───────────── end ─────────────┘  └──────── result (win/lose) ─────────┘
```

The bot's `/play` command renders whatever mode the journey is in. If the bot restarted, the player just presses `/play` again and lands exactly where they were. This one decision makes the product feel robust.

### Per-journey serialization, revisions, preconditions, and sessions (decided Oct 2026)
`dispatch` takes a per-journey lock and uses optimistic concurrency on the Journey document. **Because more than one process may run the engine (see Process topology), the lock is a short DB lease** (a `locks` document with `journeyId`, owner, and expiry, acquired atomically), not an in-process mutex. Redis can replace it later if lock traffic grows.

The lock only stops two actions writing at once. Four more rules decide *whether* an action may run. All of them are checked inside `dispatch`, under the lock, against fresh state:

| Check | Question it answers | Applies to |
|---|---|---|
| **Session claim** | Is this the journey's active `/play` session? | Actions from a play session |
| **Revision** | Did the player act on what they actually saw? | Actions that depend on the rendered view |
| **Preconditions** | Is this action allowed right now? | Every action |
| **Request ID** (battles) | Is this choice for the current battle request? | `battleChoice` (see [25 § Ownership](25-arena.md#ownership)) |

**1. Revisions.** The Journey carries `rev`, and **every engine action that writes any of the journey's game data** (Journey, its PokemonInstances, bag, flags) increments it in the same transaction: one action, one bump, even when the Journey document itself didn't change. Each rendered view records the `rev` it was drawn from: in custom IDs for plain handlers (`play:explore:<charId>:<rev>`), in session state for FlowCord menus, and in the request for the webapp. A **view-dependent** action (explore, travel, script input, shop, anything the player chose from a rendered menu) with a stale `rev` is not applied. The player gets a fresh render with "Updated: that menu was out of date". This is what turns a double-click into one explore, not two.

**2. Preconditions.** Every action declares three layers of "may this run now?":
- **Mode** (engine, fixed in code): the modes the action is valid in. Party reorder, box management, and bag use are `overworld` only. In battle, switching is a battle choice, not a party edit.
- **Rules** (region config): game-feel settings, e.g. `RegionRules.systems.storage.access: 'pcLocation' | 'anywhere'` (Gen 1 Classic: `'pcLocation'`; modern presets: `'anywhere'`). See [18](18-rules-time-and-randomness.md#decisions-oct-2026-piecemeal-rules-gen-1-first).
- **Content** (location/author): `'pcLocation'` is satisfied when the current location has `services: ['pc']` ([08](08-region-map-and-locations.md)). Authors can put a Gate on a service ("the PC is down during the takeover").

The engine exposes `availableActions(journey)` with explanations (the condition explainer from [05](05-requirements.md)), so Discord hides or disables buttons with a reason and the webapp shows views read-only. `dispatch` re-checks regardless, so a stale UI can never bypass a precondition. **View-independent** actions (a webapp party reorder) skip the revision check but never the preconditions: a reorder that lands just after a battle starts is rejected with "You're in a battle". Reading state (party, boxes, profile) is a query, not an action, and needs none of this.

**3. One active `/play` session per journey, newest wins.** Opening `/play` atomically sets `Journey.activeSession = { id, client, openedAt }` (under the lock, so it can't interleave with an in-flight action). The session ID travels with the session (FlowCord session state, or custom IDs). `dispatch` rejects actions from any other session ID, and the old session shows "This game was continued in another session" and strips its buttons. Newest wins rather than blocking the new session, because ephemeral messages can be dismissed and never reopened, and the old session may be on another device. A player can always get back in with `/play`.
- **Resuming:** the new session renders whatever mode the journey is in, the same path as after a restart. A battle resumes at the current request (with the last turn's summary), a submitted choice stands while the turn resolves, and pending prompts (learn a move, evolution, swap into party) and script dialogue resume where they were. Adventure battles have no turn timer, so switching sessions never costs a turn.
- **Old sessions shut down cleanly:** an old session still awaiting BattleService (the await-in-action pattern in [14](14-battle-system-and-showdown.md)) must check the claim before rendering, and ends silently if it's no longer active. Old battle buttons fail both the session check and the request-ID check.
- **Not session-bound:** webapp management actions (they aren't a play session; if the webapp becomes a play surface in Phase 3 it claims the same slot), game-driven events (battle turns resolving, timers), and Arena battles (participant checks in [25](25-arena.md#ownership); the **Choose** button reopens a prompt on any device).

**4. Contention and retries.** If the lease is held, `dispatch` waits up to ~1s (after an early acknowledgement to Discord, which allows 3s), then returns `actionRejected: busy`. An optimistic-concurrency conflict is retried once **only for actions without a `rev`**. A view-dependent action is never silently re-applied on fresh state, because that is exactly how duplicates happen. Retries of the same request (network replays) are deduplicated by `actionId`.

**5. Actions across two journeys** (trades, see [13](13-pokemon-instances-and-trading.md#trading-decided-oct-2026-mvp-q35)) take both journeys' leases in a fixed order (sorted by journey ID), run every check for both journeys, and commit in one transaction that bumps both revisions.

## Options

| Option | Pros | Cons |
|---|---|---|
| **A. Logic in bot handlers** (status quo) | Fastest to start | Not testable headless. Can't share with webapp/AI. Restart-fragile. |
| **B. Service functions in `shared/`** (called by handlers, but no action/event contract) | Small step | Rendering and rules stay entangled. Every handler re-implements validation and "what happened" messaging. |
| **C. Engine package with action/event contract** (chosen) | Testable. Multi-client. Replay/debug logs ("show me the last 50 actions"). Natural fit for AI and playtest bots. | Upfront design work. Events need renderers. |

## Process topology
Where the engine and battles run (embedded in the bot and webapp, with one game host for stateful runtime), sharding, deploy overlap, and live-state ownership are in [15](15-persistence-concurrency-and-runtime.md#process-topology-should-the-engine-be-its-own-container-decided-oct-2026-option-c).

## Package layout & encapsulation rules (decided Oct 2026)
Option C is only safe if the boundaries are enforced, so the engine (and the battle host) can be pulled into their own containers later without untangling code.

```
libs/core       pure: content/catalog schemas, ContentKey, PokemonSet conversions, condition/effect/fact registries,
                rule formulas (EXP, catch, escape, payout per gen), validator. No I/O, no Showdown, no Discord.
libs/battle     Showdown adapter + BattleService + AI. Depends on core + the Showdown fork + @smogon/calc.
                Knows nothing about journeys, regions, scripts, or Discord.
libs/engine     game rules: dispatch, modes, scripts, travel/explore, economy, post-battle progression.
                Depends on core. Talks to battles ONLY through a `BattlePort` interface it defines.
libs/authoring  admin commands. Depends on core.
apps/bot        game host: wires engine + the real libs/battle implementation of BattlePort, Discord renderers.
apps/webapp     wires engine with a BattlePort that only *reads* battle state (never hosts battles), plus authoring.
```

Rules (enforced with Nx module-boundary tags + `@nx/enforce-module-boundaries` lint, so violations fail CI):
1. `core` imports nothing internal. `engine`/`authoring` import only `core`. `battle` imports only `core`.
2. **Only apps compose implementations.** `engine` never imports `battle`. It receives a `BattlePort` at construction. The webapp never imports `battle`, so it never bundles Showdown.
3. Engine and battle are **constructed from injected ports** (repositories, BattlePort, Clock, Rng, event sink). No module-level singletons and no direct Mongoose/discord.js imports inside libs. Swapping an in-process port for a network client is how either one moves into its own container.
4. Everything crossing a port is **serializable data** (actions, events, battle specs, results), so the in-process call can become an API/queue message unchanged.

## Rendering and the Discord surface
The engine returns events; how they look in Discord (where play is shown (Q2), the `/play` hub, locked-option explanations, battle rendering, and FlowCord patterns) is in [26](26-discord-surface-and-ux-patterns.md).

## Authoring
Admin authoring follows the same pattern (`libs/authoring`, commands in, results out): see [16](16-authoring-validation-and-portability.md#authoring-the-same-pattern-for-region-building).

## MVP scope
- `libs/engine` with the action/event contract, per-journey lock, state revisions, action preconditions, session claims, and the mode state machine.
- Renderers for each event type in the bot.
- `/play` hub.
- Headless test harness (`engine.dispatch` against in-memory repos).
- `libs/core` + `libs/authoring` with commands for the M3/M4 builder features. Existing admin menus migrate onto them.

## Open questions
- ~~Ephemeral or public adventure play?~~ **Decided (Q2):** server-configurable, ephemeral by default and the only mode in MVP (see [26](26-discord-surface-and-ux-patterns.md#where-adventure-play-is-shown-decided-oct-2026-q2)).
- ~~Multiple Discord clients at once?~~ **Decided (Oct 2026):** one active `/play` session per journey, newest wins, and the new session resumes whatever mode the journey is in. See [Per-journey serialization](#per-journey-serialization-revisions-preconditions-and-sessions-decided-oct-2026).
- ~~`/play` only, or shortcuts?~~ **Decided (Oct 2026):** `/play` only in MVP. Shortcuts (`/bag`, `/party`, …) come later as deep links into the matching `/play` screen, and they claim the play session like `/play` does.
