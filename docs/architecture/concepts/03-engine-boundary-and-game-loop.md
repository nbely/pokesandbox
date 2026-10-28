# 03: Engine Boundary & Game Loop

> **TL;DR:** Put all game rules in a Discord-agnostic **`libs/engine`** package with one entry point: `dispatch(characterId, action) → { state', events[] }`. The bot (and later the webapp) are *clients* that turn button presses into actions and render the resulting events. Long-running interactions (dialogue, choices, battles) are **persisted state on the character**, not FlowCord session memory.

**MVP impact:** Very high · **Cost to change later:** Very high

## Why it matters

Today the "domain logic" is inside FlowCord menu handlers. That works for admin CRUD. It breaks down for gameplay because:

- **Multiple clients.** Your roadmap has the webapp becoming a play surface, AI judges, and staff ops. Rules duplicated across clients diverge.
- **Restarts.** A FlowCord session is in-memory. If the bot restarts mid-gym-battle or mid-dialogue, the player's progress must survive. The source of truth must be the DB.
- **Concurrency.** Players double-click, open two menus, or trade while battling. Rules need one serialized choke point per character.
- **Testing.** "Can a level-5 Charmander beat Brock with the AI on hard?" and "is Route 3 reachable without Cut?" must run headless.
- **AI trainers and playtesting bots** should drive the same engine that players do.

## Proposed shape

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
  | { type: 'enteredLocation'; location: ContentKey }
  | { type: 'dialogue'; speaker?: string; text: string; awaitsInput: boolean }
  | { type: 'choicePrompt'; options: …[] }
  | { type: 'battleStarted'; battleId: string; … }
  | { type: 'itemsChanged'; … } | { type: 'pokemonGranted'; … } | { type: 'progressChanged'; … }
  | { type: 'actionRejected'; reason: ConditionExplanation };
```

**Rules the engine owns:** condition evaluation, effect application, the script VM, travel/encounter resolution, the battle lifecycle (via BattleService), EXP/level/evolution, the economy.
**The bot owns:** turning events into embeds/components, FlowCord navigation, permissions, rate limiting.

### The "mode" state machine
At any moment a character is in exactly one **mode**, persisted on the character:

```
overworld ──interact/trigger──► script(pc, locals) ──battle step──► battle(battleId)
    ▲                               │  ▲                                   │
    └───────────── end ─────────────┘  └──────── result (win/lose) ─────────┘
```

The bot's `/play` command renders whatever mode the character is in. If the bot restarted, the player just presses `/play` again and lands exactly where they were. This one decision makes the product feel robust.

### Per-character serialization
`dispatch` takes a per-character lock (in-process mutex in MVP; Redis lock when sharded) and uses optimistic concurrency on the Character document. Double-clicks become no-ops or "already processing" instead of double rewards.

## Options

| Option | Pros | Cons |
|---|---|---|
| **A. Logic in bot handlers** (status quo) | Fastest to start | Not testable headless. Can't share with webapp/AI. Restart-fragile. |
| **B. Service functions in `shared/`** (called by handlers, but no action/event contract) | Small step | Rendering and rules stay entangled. Every handler re-implements validation and "what happened" messaging. |
| **C. Engine package with action/event contract** (recommended) | Testable. Multi-client. Replay/debug logs ("show me the last 50 actions"). Natural fit for AI and playtest bots. | Upfront design work. Events need renderers. |

## Discord surface (game-dev perspective)

- **One `/play` hub** per region with contextual buttons (Travel, Explore, Talk, Shop, Party, Bag, Map) instead of dozens of slash commands. FlowCord's menu graph is perfect for this. This also matches the UX lesson from your FlowCord "Street Dominion" chat.
- **Where does play happen?** Ephemeral messages (private, clean, but invisible to the community) or public channel/thread per player (social and RP-friendly, but noisy). Probably a per-region choice. Battles in the PvP arena are public by design. See open questions.
- **Global commands.** Move from guild-folder registration to global registration. Gate features by per-server config instead.

## FlowCord implications
- FlowCord sessions stay **UI-only**. Don't store engine objects (battle streams, character docs) in session state. Store IDs and re-fetch through the engine. This resolves the "how do I keep the Showdown stream in a `Record<string, unknown>` without cloning" problem from your Alpha-strategy chat. The stream lives in `BattleService`, keyed by `battleId`.
- **Multi-user flows** (PvP, trades) are needed for Pre-MVP. They belong in FlowCord as a generic capability, but the *turn loop* lives in the engine/BattleService, as you concluded in that chat.

## MVP scope
- `libs/engine` with the action/event contract, per-character lock, and mode state machine.
- Renderers for each event type in the bot.
- `/play` hub.
- Headless test harness (`engine.dispatch` against in-memory repos).

## Open questions
- Is adventure play **ephemeral (private)** or **in public channels/threads**? Can the server choose?
- Can a character act from **multiple Discord clients at once** (phone and desktop)? (The lock handles it, but UX should show "session moved".)
- Should `/play` be the *only* player command, or do you want shortcuts (`/bag`, `/party`) too?
