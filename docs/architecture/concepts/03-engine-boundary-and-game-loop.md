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
`dispatch` takes a per-character lock and uses optimistic concurrency on the Character document. Double-clicks become no-ops or "already processing" instead of double rewards. **Because more than one process may run the engine (see Process topology), the lock is a short DB lease** (a `locks` document with `characterId`, owner, and expiry, acquired atomically), not an in-process mutex. Redis can replace it later if lock traffic grows.

## Options

| Option | Pros | Cons |
|---|---|---|
| **A. Logic in bot handlers** (status quo) | Fastest to start | Not testable headless. Can't share with webapp/AI. Restart-fragile. |
| **B. Service functions in `shared/`** (called by handlers, but no action/event contract) | Small step | Rendering and rules stay entangled. Every handler re-implements validation and "what happened" messaging. |
| **C. Engine package with action/event contract** (recommended) | Testable. Multi-client. Replay/debug logs ("show me the last 50 actions"). Natural fit for AI and playtest bots. | Upfront design work. Events need renderers. |

## Process topology: should the engine be its own container? (decided Oct 2026: option C)

**Concern:** if game actions also run from the webapp (e.g. box reordering), they shouldn't depend on the Discord bot process being up.

| Option | How | For | Against |
|---|---|---|---|
| **A. Embedded library** | Bot and webapp both import `libs/engine` and call `dispatch` in-process against the same DB | Webapp actions keep working when the bot is down. No extra service, API, or cost. | Locks must work across processes (DB lease). Stateful parts (live battles, timers) can only live in one process. |
| **B. Separate engine service** | Engine runs in its own container. Bot and webapp call it over an API (e.g. tRPC/HTTP), and it pushes events back (pub/sub) | One authority for locks, battles, timers. Bot crashes don't touch game state. Scales independently. | Another container (cost) and an API contract, auth between services, and event push to the bot. **The engine becomes a single point of failure for both clients**, which is the same blast radius moved, not removed. |
| **C. Hybrid (recommended)** | A now, designed for B: `libs/engine` is embedded in both clients for **stateless, short actions** (box reorder, party order, profile settings). **Stateful runtime** (BattleService, turn timers, scheduled jobs) runs in exactly one **game host** process, which is the bot process for MVP. | The webapp is independent of the bot for QoL actions. There's no extra container yet. Extraction later is mechanical, because the boundary is already "action in, events out". | Two deployment shapes to keep in mind. The webapp must refuse actions that touch Pokémon in an active battle (the character's `mode` already says so). |

**Notes on option C:**
- **Failure isolation you actually get:** the webapp (box management, profiles, authoring) keeps working if the bot crashes. Discord play is down while the bot is down under *any* option, since Discord *is* that client. Live battles are persisted and recovered on restart, so a bot crash costs a few seconds, not game state.
- **Correctness across processes** comes from the DB: lease-based per-character locks, optimistic concurrency on Character/Pokémon documents, and transactions for multi-document changes. Nothing relies on in-memory state shared between processes.
- **CPU isolation inside the game host:** AI turn search and battle simulation run in **worker threads**, so heavy AI can't stall the bot's Discord event loop.
- **When to extract the engine/game host into its own container (option B):**
  - The bot shards into multiple processes (battles need one authority).
  - A second client needs real-time gameplay (e.g. a webapp battle UI).
  - Engine CPU or memory starts hurting bot responsiveness despite workers.

  The extraction is: wrap `dispatch` and BattleService in an API, move the battle host into the new container, and have the bot subscribe to events. No game logic changes.

### Package layout & encapsulation rules (decided Oct 2026)
Option C is only safe if the boundaries are enforced, so the engine (and the battle host) can be pulled into their own containers later without untangling code.

```
libs/core       pure: content/catalog schemas, ContentKey, PokemonSet conversions, condition/effect/fact registries,
                rule formulas (EXP, catch, escape, payout per gen), validator. No I/O, no Showdown, no Discord.
libs/battle     Showdown adapter + BattleService + AI. Depends on core + the Showdown fork + @smogon/calc.
                Knows nothing about characters, regions, scripts, or Discord.
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

## Where adventure play is shown (decided Oct 2026, Q2)
- **Server-configurable display mode, ephemeral by default.** MVP implements only ephemeral. **Per-player threads** are the long-term favorite. A designated play channel is the third option.
  ```ts
  Server.settings.play: { mode: 'ephemeral' | 'thread' | 'channel'; channelId?: string; threadVisibility?: 'private' | 'public' }
  Region.settings.playOverride?: same shape   // optional per-region override
  ```
  Because the engine emits events and renderers draw them, each mode is a different *renderer target*, not different game logic.
- **Highlights channel** (opt-in posts for badges, rare catches, champion clears): a nice follow-up, not MVP. It reuses the opt-in, configurable-channel pattern from release notes.
- **Viewing other players:** on the webapp in MVP. Discord lookup commands come later.
- **Privacy:** players control who can see their profile and each character (see [13](13-characters-and-pokemon-instances.md#privacy-decided-oct-2026)).

## Discord surface (game-dev perspective)

- **One `/play` hub** per region with contextual buttons (Travel, Explore, Talk, Shop, Party, Bag, Map) instead of dozens of slash commands. FlowCord's menu graph is perfect for this. This also matches the UX lesson from your FlowCord "Street Dominion" chat.
- **Where does play happen?** Ephemeral messages (private, clean, but invisible to the community) or public channel/thread per player (social and RP-friendly, but noisy). Probably a per-region choice. Battles in the PvP arena are public by design. See open questions.
- **Global commands.** Move from guild-folder registration to global registration. Gate features by per-server config instead.

## FlowCord implications
- FlowCord sessions stay **UI-only**. Don't store engine objects (battle streams, character docs) in session state. Store IDs and re-fetch through the engine. This resolves the "how do I keep the Showdown stream in a `Record<string, unknown>` without cloning" problem from your Alpha-strategy chat. The stream lives in `BattleService`, keyed by `battleId`.
- **Multi-user flows** (PvP, trades) are needed for Pre-MVP. They belong in FlowCord as a generic capability, but the *turn loop* lives in the engine/BattleService, as you concluded in that chat.

## Authoring: the same pattern for region building

> **Decision (Oct 2026):** Option C was adopted for gameplay. Because a webapp builder is likely (more screen space, custom controls such as graph and script editors), admin authoring follows the same pattern.

Once two clients (FlowCord admin menus and the webapp) can both edit a region, any rule that lives in a client gets duplicated and drifts. Examples:
- Delete a location → remove inbound edges.
- The two-way connection toggle.
- Content key generation.
- "Used by" checks before delete.
- Condition and effect validation.
- Permission checks.

```
FlowCord admin menus ─┐
                      ├─► libs/authoring ─► draft content repos (Mongo)
Webapp builder (tRPC) ┘    commands in        │
                           results out        └─► publish ─► validator ─► RegionRelease
```

```ts
type AuthoringCommand =
  | { type: 'location.create'; regionId; name; kind; parentKey? }
  | { type: 'location.connect'; regionId; from; to; twoWay: boolean; condition? }
  | { type: 'location.delete'; regionId; key }   // cascades inbound edges, or refuses with "used by"
  | { type: 'progression.upsert'; regionId; key?; definition }
  | { type: 'script.update'; regionId; key; steps }
  | { type: 'region.publish'; regionId }
  | …;

authoring.execute(actor, command) → { ok: true; changes: ContentChange[]; warnings: Issue[]; suggestions: Suggestion[] } | { ok: false; issues: Issue[] }
// suggestions: follow-up commands a client may offer (e.g. after adding HM Fly: "Enable traditional Fly travel?"). Empty in MVP; the hook exists so builder shortcuts are additive later.
```

**How it differs from the gameplay engine:**

| | `libs/engine` (play) | `libs/authoring` (build) |
|---|---|---|
| Operates on | Character state + a published release | Draft content documents |
| Concurrency | Per-character lock, optimistic concurrency on Character | Per-entity optimistic concurrency (`version` per location/script/etc.). On conflict, return "this was changed by X, reload" instead of a silent overwrite. |
| Validation | Conditions evaluated at runtime | Schema validation per command + Region Health (the full validator) on demand and at publish |
| Output | `GameEvent[]` for renderers | `ContentChange[]` (for the audit log, cache invalidation, and the webapp's live refresh) |
| Auth | Character owner | `actor` = Discord user + server role check (admin/mod role IDs). The webapp resolves roles through the bot or the Discord API, never trusting the browser. |

**Shared foundation.** Both packages build on one core of content schemas, the condition/effect registries, and the validator. The validator needs the registries' `validate()` and `references()`, and the engine needs `evaluate()`. Suggested layout:
- `libs/core`: content schemas, ContentKey, registries, validator.
- `libs/engine`: runtime.
- `libs/authoring`: admin commands.

Zod command schemas double as form schemas in the webapp and modal validation in Discord.

**What each client is good for:**
- **Discord builder:** quick edits, mobile, templates ("Add Gym Leader"), Region Health checks, publishing.
- **Webapp builder:** the location graph canvas, script step editor, encounter-table grids, bulk edits, and JSON import/export.

Both call the same commands, so either can be the "complete" one without duplicating rules.

**Migration:** new builder features (connections, encounters, NPCs, scripts, shops) go through `libs/authoring` from day one. The existing pokedex, progression, and locations menus move over during M0/M3, which is also when they adopt content keys and conditions.

## MVP scope
- `libs/engine` with the action/event contract, per-character lock, and mode state machine.
- Renderers for each event type in the bot.
- `/play` hub.
- Headless test harness (`engine.dispatch` against in-memory repos).
- `libs/core` + `libs/authoring` with commands for the M3/M4 builder features. Existing admin menus migrate onto them.

## Open questions
- Is adventure play **ephemeral (private)** or **in public channels/threads**? Can the server choose?
- Can a character act from **multiple Discord clients at once** (phone and desktop)? (The lock handles it, but UX should show "session moved".)
- Should `/play` be the *only* player command, or do you want shortcuts (`/bag`, `/party`) too?
