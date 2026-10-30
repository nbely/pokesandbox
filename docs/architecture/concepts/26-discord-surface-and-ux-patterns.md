# 26: Discord Surface & UX Patterns

> **TL;DR:** Game rules emit events; the bot's **renderers** decide how they look. This doc collects the rules for how PokeSandbox looks and behaves in Discord: where play is shown, the `/play` hub, how locked options explain themselves, how battles render, and the FlowCord patterns (single-user sessions, await-in-action, the 15-minute ephemeral limit). Anyone building a renderer or a menu should read it first.

**MVP impact:** High (every player-facing screen) · **Cost to change later:** Low per screen, high if the patterns diverge

## Principles
- **Rules emit, renderers draw.** The engine and BattleService return events ([03](03-engine-boundary-and-game-loop.md)); renderers turn them into Components v2 messages. No game logic lives in a menu handler.
- **Pure view builders.** Renderers are functions from a view model to Components v2 JSON, with no I/O, so they can be snapshot-tested and reused by FlowCord menus, plain handlers, and later the webapp.
- **Discord-complete.** Every player action and every authoring capability works from Discord. The webapp adds richer screens; it's never the only path ([16](16-authoring-validation-and-portability.md#principle-discord-complete-authoring-decided-oct-2026)).
- **Components v2** for dense layouts: containers, sections with thumbnails, media galleries. FlowCord supports them.

## Where adventure play is shown (decided Oct 2026, Q2)
- **Server-configurable display mode, ephemeral by default.** MVP implements only ephemeral. **Per-player threads** are the long-term favorite. A designated play channel is the third option.
  ```ts
  Server.settings.play: { mode: 'ephemeral' | 'thread' | 'channel'; channelId?: string; threadVisibility?: 'private' | 'public' }
  Region.settings.playOverride?: same shape   // optional per-region override
  ```
  Because the engine emits events and renderers draw them, each mode is a different *renderer target*, not different game logic.
- **Highlights channel** (opt-in posts for badges, rare catches, champion clears): a follow-up, not MVP. It reuses the opt-in, configurable-channel pattern from release notes ([01](01-content-vs-state-and-publishing.md#decisions-oct-2026)).
- **Viewing other players:** on the webapp in MVP. Discord lookup commands come later. Both respect profile and character privacy ([23](23-players-characters-journeys-and-scopes.md#privacy-decided-oct-2026)).
- **Arena battles are public by design** ([25](25-arena.md)).

## Commands
- **One `/play` hub** per region with contextual buttons (Travel, Explore, Talk, Shop, Party, Bag, Map) instead of dozens of slash commands. `/play` is the only player command in the MVP. Shortcuts (`/bag`, `/party`) come later as deep links into the matching `/play` screen, and they claim the play session like `/play` does ([03](03-engine-boundary-and-game-loop.md)).
- **`/arena`** is the Arena hub ([25](25-arena.md)).
- **Global commands.** Register commands globally and gate features by per-server config, instead of the current per-guild folder registration.

## Menus and feedback
- **Locked options always explain themselves.** An option shown as locked (gate presentation `locked`, [05](05-requirements.md)) stays in the list with a 🔒 marker, and its explanation is always reachable: shown inline (the option's description or text under the list), or the option stays pressable and replies with it. A disabled Discord button can't be pressed, so on its own it gives the player no way to learn why. The engine's `availableActions(journey)` provides the explanation ([03](03-engine-boundary-and-game-loop.md)).
- **Long lists are grouped and paginated.** Destination lists (Fly, ferries) are grouped by area (`parentKey` or a region area) and paginated when long, so a late-game Fly list stays one screen per area. Each option shows its cost ("Ferry to Vermilion · ₽500"), and one the player can't afford is shown locked with the preflight explanation ("You need ₽500", [06](06-effects.md)). The same applies to shops and the Pokédex search.
- **Engine responses have fixed wording**, so players learn them once ([03](03-engine-boundary-and-game-loop.md#per-journey-serialization-revisions-preconditions-and-sessions-decided-oct-2026)):
  - a stale menu re-renders with "Updated: that menu was out of date";
  - a superseded session shows "This game was continued in another session" and strips its buttons;
  - lock contention after ~1s returns "Still working on your last action…";
  - a battle press during a process handover replies "Battle is resuming, press again in a moment" ([15](15-persistence-concurrency-and-runtime.md#sharding-deploys-and-who-owns-live-state-decided-oct-2026)).
- **Rewards render themselves.** Effects produce events ("You received a Potion!"), so authors never write that text ([06](06-effects.md)).

## Dialogue and passages
Script text is authored as **passages**: prose, dialogue lines, and images interleaved ([07](07-scripts-triggers-and-events.md#passages-prose-and-dialogue-decided-oct-2026)). The renderer turns them into Components v2 messages.

- **Always Components v2 under the hood.** Every renderer emits Components v2. What's limited is author customization: authors choose named styles and themes; they never hand-write component layouts. Raw layouts can't be edited sensibly in Discord modals (Discord-complete authoring), break when Discord changes its component rules, and would fight the engine's paging and choice placement.
- **Styles** (mapped to Components v2 by the renderer):

  | Style | Renders as | Use | When |
  |---|---|---|---|
  | `dialogue` (default) | The speaker's portrait as a section thumbnail beside the text | Conversations | MVP |
  | `prose` | Full-width text, no portrait, optional banner image | Scene-setting, travel, story beats | MVP |
  | `cutscene` | Large media at the top, prose below | Arrivals, legendary encounters | Later |
  | `document` | A bordered container with a title | Signs, letters, books, Pokédex entries, journals | Later |
  | `system` | A compact, muted line | "You received…", tutorials | Later |

- **Region themes (later)** set defaults: accent color, header image, the style each kind of step uses. A passage can override its style.
- **Author-defined styles (later)** combine a fixed set of slots (accent, header image, portrait position, thumbnail, title), so "make it look like my game" never needs raw JSON.
- **Auto-paging by budget.** A Components v2 message allows at most **40 components counting nested ones** and roughly **4,000 characters of text** (sources differ on whether that counts only text displays). Images go in section thumbnails (one per section) and media galleries (the per-gallery item limit, often cited as 10, is to be verified against Discord's docs when building the renderer). A Components v2 message can't also carry embeds or plain content. Text length and component count bind long before images do, so the renderer fills each page up to a text and component budget, splits only between blocks, and puts choices on the last page.
- **Name placeholders** (`{name:rival}`) are filled at render time from the journey's name slots ([23](23-players-characters-journeys-and-scopes.md)).
- **Choices** render as buttons (few options) or a select (many), under the passage's last page.

## Battles
- **Battle view (decided Oct 2026):** each turn shows the turn's messages, then both active Pokémon with level, HP, and status. **MVP:** the two sprites as separate images in a Components v2 layout (thumbnails or a media gallery), with no image service. **Post-MVP:** one composed image per matchup with both sprites side by side (player's left, opponent's right), cached because sprite URLs are stable.
- **Battle text:** render messages from Showdown's own text data (`data/text`, the templates the Showdown client uses), and read HP, status, and stat stages from the sim's requests and protocol. Hand-written message strings and a second copy of battle state drift from the sim as moves and mechanics are added.
- **Spectating (Arena PvP):** the battle renders to a public channel message, edited once per resolved turn; choices go to each player's private prompt. Who renders what, and who owns rounds and timers, is in [25 § Ownership](25-arena.md#ownership).
- **Adventure battles** render inside the player's `/play` session (ephemeral in MVP) using the same view builders.

## FlowCord patterns
- **Sessions are UI-only.** Don't store engine objects (battle streams, journey documents) in session state. Store IDs (`journeyId`, `battleId`, `teamId`) and re-fetch through the engine. Battle streams live in BattleService, keyed by `battleId`.
- **FlowCord is single-user.** Multi-user surfaces (Arena challenges, the public battle message, trade messages) are plain discord.js handlers with stable custom IDs behind a port, so they survive restarts and can move to FlowCord later (Q34, [25](25-arena.md#multiplayer-boundary-with-flowcord-decided-oct-2026-q34)). Trades use the same pattern ([13](13-pokemon-instances-and-trading.md)).
- **Anything that must survive a restart uses stable custom IDs** that encode only persistent data (`arena:<verb>:<recordId>`). FlowCord's IDs embed a per-process session ID, so its buttons don't survive restarts; `/play` recovers by re-rendering from the journey's persisted mode instead.
- **Await-in-action pattern (single-player battles):** in a one-person FlowCord session, a button action may `await` BattleService until the player's next request (AI turn done, level-up prompt). The session renders when the action returns, so no external refresh API is needed. This fits PvAI and adventure battles (including the in-battle "learn a new move?" prompt). It doesn't fit PvP, where the wait belongs to someone else and the public message has to update for everyone. A session waiting this way must check that it's still the active session before rendering ([03](03-engine-boundary-and-game-loop.md)).
- **Caveat: 15-minute ephemeral edits.** FlowCord's `DiscordAdapter` edits ephemeral messages through the **entry** interaction's token, so an ephemeral session likely can't re-render 15 minutes after its slash command. This comes from reading the code and hasn't been reproduced. It affects long `/play` sessions (ephemeral is the Q2 default) more than the Arena. Filed as [flowcord#107](https://github.com/flowcord-dev/flowcord/issues/107) (`bug: unconfirmed`, milestone alpha.3). Until it's fixed, `/play` must handle an expired token by asking the player to press `/play` again, which resumes exactly where they were.

## Authoring screens
Builder-specific UX (Region Health, "used by" before deletes, templates over raw editors, the webapp editors) is in [16](16-authoring-validation-and-portability.md).

## MVP scope
- Ephemeral `/play` hub and its renderers; locked-option explanations; grouped, paginated lists with costs.
- Passages (prose, dialogue, images) with the `dialogue` and `prose` styles, auto-paging, markdown, and name placeholders.
- Battle view with separate sprite images and Showdown battle text.
- Stable custom IDs for every surface that must survive restarts; the fixed engine-response wording.
- Not MVP: thread and channel play modes, highlights channel, Discord lookup commands, the `cutscene` / `document` / `system` styles, region themes and author-defined styles, composed battle images, command shortcuts.

## Open questions
- Should the highlights channel and release notes share one "announcements" setting, or stay separate?
