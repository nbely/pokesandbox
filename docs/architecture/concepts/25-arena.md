# 25: Arena

> **TL;DR:** The Arena is the first public release (Phase 1): PvP and PvAI battles between server members, with no adventure state involved. Teams are **user-owned presets** in Showdown set shape. **Formats are server-scoped**, so the Arena works on a fresh server before any region exists. **BattleService owns rounds and timers** ([14](14-battle-system-and-showdown.md)), and the Arena's shared Discord surfaces (challenges, the public battle message, participant checks, private prompts) are plain discord.js handlers behind a `BattleSurface` port. FlowCord runs only the single-user `/arena` hub (Q34).

**MVP impact:** Very high (it's public release #1, milestones M1–M2) · **Cost to change later:** Medium

## What the Arena is
- **PvP:** challenge a member (direct) or post an open challenge, battle in a public channel message that spectators can watch, choose moves in private prompts.
- **PvAI:** battle an AI side at a chosen difficulty, with no timer.
- **Independent of regions:** it doesn't need the adventure engine, a deployed region, or a journey. It uses `libs/battle` plus a thin Arena module in `apps/bot` ([14](14-battle-system-and-showdown.md#package-placement-decided-oct-2026-its-own-library-libsbattle)). Pausing a region has no effect on it.
- **Players are users here, not characters:** teams, challenges, and records belong to the user ([23](23-players-characters-journeys-and-scopes.md#scopes-decided-oct-2026)).

## Teams (decided Oct 2026, Q12)
Arena teams aren't owned Pokémon ([13](13-pokemon-instances-and-trading.md)). They're **TeamPresets**:

```ts
TeamPreset {                     // owned by the USER, usable across servers
  _id; userId; name;
  intendedFormat?: { serverId?: ObjectId | 'builtin'; formatId };   // UI hint only. Validated against the chosen format at challenge time.
  sets: PokemonSet[];            /* Showdown set shape; species may be canon IDs or <ns>:<slug> library IDs */
}
// Cap: 50 teams per user for now (folders later). A team using a server's library species only validates
// where that content is available. Canon-only teams work on any server with a compatible format.
```

- **At launch:** Showdown paste import/export (one modal, and the format competitive players already know), a random legal team for any format, and per-Pokémon validation errors.
- **Next:** a guided builder on Components v2 and FlowCord submenu/pagination flows, reusing the region Pokédex builder's Pokémon search flow. It's essential once servers have custom Pokémon, which external teambuilders don't know.
- **Later:** a webapp builder, and public team sharing.
- The same `PokemonSet` shape is what adventure Pokémon convert to, so the validator and battle hookup are shared with adventure battles.

## Arena formats (decided Oct 2026: server-scoped, not region-scoped)

PvP in the Arena isn't tied to any region's deployment or adventure state. It's tied to the **server** and the formats the server offers. A format defines *which Pokémon/moves/items are legal* and *the battle rules*:

```ts
ArenaFormat {
  id; serverId | 'builtin'; name;                    // "Server OU", "Little Cup Lv5", "Kanto 151 Lv50"
  pool: {                                            // where legal species come from (union of sources)
    canon?: { gens?: number[]; tiers?: string[] } | 'all';
    library?: 'all' | SpeciesId[];                   // the server's custom content (fakemon etc.)
    fromRegionDex?: RegionId;                        // optional convenience: "species in this region's dex"
    include?: SpeciesId[]; exclude?: SpeciesId[];    // bans
  };
  bans?: { moves?: MoveId[]; abilities?: string[]; items?: ItemId[] };
  rules: { mechanicsGen; level: 'as-built' | 50 | 100 | { max: number }; gameType: 'singles' | 'doubles'; clauses: string[]; teamSize; pickN?; timer;
          statInvestment?: 'as-built' | 'max' | { ivs?: …; evs?: … } };   // Phase 3: applied to adventure Pokémon copies (see Adventure Pokémon below)
}
```

- **Built-in formats** (e.g. National Dex Lv50, a Gen 1 151 format) ship by default, so the Arena works on a fresh server with zero setup.
- Admins can create server formats that mix canon and **server library** content (see [12](12-content-catalog-species-moves-items.md#server-content-library-decided-oct-2026)). `fromRegionDex` is just a convenience source. A format never depends on a region being deployed.
- Compiles to a custom format whose data (canon + selected library entries + overrides) is injected into its own isolated dex, so `TeamValidator` enforces it. See [12 § Species identity](12-content-catalog-species-moves-items.md#species-identity-canon-custom-species-variants-overrides--sharing-decided-oct-2026-q19).
- Pausing a region has **no effect** on Arena battles. (Only Phase 3 in-game PvP with *adventure parties* is region-bound.)

## Timers and AI opponents
- **Turn timer (Q13):** PvP 90s per decision. A timeout plays the default move; 3 consecutive timeouts forfeit. Challenges expire after 5 minutes. PvAI has no timer. Owned and persisted by BattleService (see Ownership above).
- **AI opponents (Q14):** at launch, random legal teams generated from the format (works for custom formats and library species, with heuristic movesets), with difficulty set by the AI profile ([14 § AI trainers](14-battle-system-and-showdown.md#ai-trainers)). Admin-authored AI team sets come later.

## Multiplayer boundary with FlowCord (decided Oct 2026, Q34)

> **TL;DR:** **BattleService owns rounds and timers.** It runs the round loop from its own events, not from Discord interactions. The Arena's shared surfaces (the public battle message, challenge messages, participant checks) are **plain discord.js handlers with stable custom IDs**, driven by BattleService and DB records. **FlowCord stays single-user** and is used for the `/arena` hub and other one-person menus. The Arena does **not** depend on FlowCord adding multi-user sessions. A `BattleSurface` port keeps the option to move the shared surfaces onto FlowCord later without touching orchestration.

### Why FlowCord can't own the round loop
Verified against FlowCord `develop` (v0.1.0-alpha.2), Oct 2026:
- **Sessions are in-memory and interaction-driven.** `MenuSession.processMenus()` renders, then blocks on one `awaitMessageComponent` filtered to the session's single user. Nothing outside a Discord interaction can make it render, and FlowCord's own docs say sessions die on restart ([session persistence](https://github.com/flowcord-dev/flowcord/blob/develop/packages/docs/docs/advanced/session-persistence.md)).
- **Turns resolve outside interactions.** The AI picks in a worker thread, timers fire, and recovery replays the log. All of these happen without a button press. A round loop built from live participant sessions can't survive a restart and doesn't wake on BattleService events.
- **Timeout policy is a game rule** (Q13: default move, 3 in a row forfeits). FlowCord timeouts are collector timers that reset on restart. Duplicating the rule in a UI library would split it from the battle record that recovery depends on.
- **Restart recovery needs stable IDs.** FlowCord custom IDs embed a random per-process session ID (`fc:{sessionId}:{menu}:{index}`), so buttons on a pre-restart message match nothing after a restart. A session can only start from a slash command and can't bind to an existing message.

### Ownership

| Concern | Owner | Mechanism |
|---|---|---|
| **Round loop** (collect both sides, resolve, next request) | `libs/battle` BattleService | Showdown requests drive it. `choose(id, side, choice, rqid)` validates against the current request. Events go out through `subscribe`. |
| **Turn timer** (90s, default move, 3 consecutive → forfeit) | `libs/battle` BattleService | A per-side `deadlineAt` is persisted with the battle and armed through an injected `Scheduler`/`Clock` port. On expiry it calls `choose(side, 'default')` (Showdown's own default choice) and increments `consecutiveTimeouts[side]`. A real choice resets the counter. Reaching 3 ends the battle as a forfeit. Enabled per format (`rules.timer`). Off for PvAI and adventure. |
| **Serialization** (simultaneous presses, timer vs press) | `libs/battle` BattleService | One in-process queue per `battleId` in the game host. A choice whose `rqid` is stale or already answered is a no-op, so a request is never resolved twice. |
| **Challenges** (direct, open, 5-min expiry) | Arena module (`apps/bot`) + Mongo | A `Challenge` record. Accepting is a conditional update: `{ _id, status: 'open', expiresAt > now }` → `claimed`. The first valid accepter wins across restarts. The expiry job only does UI cleanup, because the claim query already enforces expiry. |
| **Public battle message** | Arena module (`apps/bot`) | A projector subscribes to BattleService events and edits one channel message per turn, with edits coalesced for rate limits. `{ channelId, messageId }` is stored on an `ArenaMatch` record, not in `libs/battle`, which stays Discord-free. |
| **Who may press** (participants vs spectators) | Arena module (`apps/bot`) | Stable custom IDs (`arena:<verb>:<matchId>`) handled before FlowCord routing. Non-participants get an ephemeral "This isn't your battle". |
| **Private choice prompt** | Arena module (`apps/bot`), FlowCord optional | Opened by the player's own press on the public message's **Choose** button. Discord can only deliver an ephemeral in reply to that user's interaction. Lock-in calls `BattleService.choose` and updates the prompt in the same interaction. Best effort: the prompt advances to the next turn by editing through the player's last token (valid 15 min, in memory only). The **Choose** button always works as the fallback. |
| **Menus around the battle** (`/arena` hub, team pick, format pick, "challenge @user", PvAI setup, history) | FlowCord | Normal single-user sessions. Session state holds IDs only (`teamId`, `formatId`, `challengeId`, `battleId`). |
| **Rendering** | `apps/bot` pure view builders | `(BattleView) → Components v2 JSON`, with no I/O. Shared by the projector, the prompt handlers, and any future FlowCord menu. |
| **Persistence and recovery** | BattleService (battle) + Arena module (surface) | `BattleService.recover()` rebuilds battles from seed + input log and re-arms timers with a **fresh full window**, so the restart doesn't count as a timeout. It then emits `battleRecovered`. The projector re-renders the stored `messageId` in place, so the same message comes back with live buttons. In-memory prompt tokens are lost, and players press **Choose** again. Open challenges are re-armed from `expiresAt`. |

```ts
// apps/bot: the seam that lets the shared surfaces move to FlowCord later
interface BattleSurface {
  publish(match: ArenaMatch, view: BattleView): Promise<SurfaceRef>;  // first post → { channelId, messageId }
  update(ref: SurfaceRef, view: BattleView): Promise<void>;            // per turn, coalesced
  end(ref: SurfaceRef, result: BattleResultView): Promise<void>;
}
```

### Acceptance scenarios

| # | Scenario | How it's met |
|---|---|---|
| 1 | Direct challenge: only the challenged player can respond, 5-min expiry | `Challenge.targetUserId` is checked in the handler. The claim query enforces expiry. |
| 2 | Open challenge: first valid accepter wins, others politely rejected | Conditional update on `status: 'open'`. Losers get an ephemeral "Already taken". Rejected: the challenger, players with no legal team for the format, players already in a battle. |
| 3 | PvP turn loop | BattleService requests → each player's prompt → `choose` ×2 → resolve → projector edit → next request. |
| 4 | Timeouts | BattleService deadline → `default` choice and counter. 3 consecutive → forfeit. The deadline shows on the public message as a Discord relative timestamp. |
| 5 | PvAI | The AI side answers from its worker through the same `choose`, and the projector updates on the event. No timer. The player's prompt can use the await-in-action pattern ([26](26-discord-surface-and-ux-patterns.md#flowcord-patterns)). |
| 6 | Spectators | They see the public message. Their presses get "This isn't your battle". |
| 7 | Simultaneous presses | The per-battle queue and `rqid` check. A double press gets "Already locked in". |
| 8 | Bot restart mid-battle | `recover()` → `battleRecovered` → re-render the stored message → players press **Choose** for fresh prompts. |

Single-player prompts (PvAI and adventure battles) can use the await-in-action pattern instead of a shared surface; it and the 15-minute ephemeral caveat are in [26](26-discord-surface-and-ux-patterns.md#flowcord-patterns).

### Migrating the shared surfaces to FlowCord later
If FlowCord ships shared sessions, app-driven refresh, and message adoption, write a FlowCord-backed `BattleSurface` and the private-prompt menus against it. BattleService, timers, challenge records, and recovery stay as they are, because none of them live in the UI. The view builders port directly into the menus' render callbacks.

## Adventure Pokémon in the Arena (Phase 3, decided Oct 2026)
The Arena battles a **copy** of an adventure Pokémon in Showdown set shape, never the instance itself, so no EXP, HP loss, or level changes carry back. The format adjusts the copy: level scaling to the format's level (Lv50 etc.) and **stat-investment overrides** (`rules.statInvestment`, e.g. max IVs/EVs, or max DVs/Stat Exp under Gen 1 rules) so adventure Pokémon match how the format treats built teams. Format legality (species, moves, clauses) is validated as for any team.

## MVP scope
- M1: `TeamPreset`, `ArenaFormat` + built-in formats, paste import/export, random legal teams, BattleService timers.
- M2 (E-M2-2): the interaction router with stable IDs, challenges, the public battle message projector, private choice prompts, scenario tests and a restart drill, the `/arena` hub, PvAI setup, battle history.
- Later: the guided builder, admin-authored AI teams, team sharing, adventure Pokémon in the Arena.

## Open questions
- ~~Arena per region or server-wide?~~ **Decided (Q10):** server-scoped formats (see Arena formats).
- ~~Level normalization and clauses?~~ **Decided (Q11):** built-in formats are flat Lv50 (auto-adjusted) with Showdown standard clauses (Species, Sleep, OHKO, Evasion, Endless Battle), team preview, and singles/doubles variants. Server formats configure their own.
- ~~Team building UX?~~ **Decided (Q12):** see Teams.
- ~~Timer and AI teams?~~ **Decided (Q13, Q14):** see Timers and AI opponents.
- ~~Shared surfaces on FlowCord?~~ **Decided (Q34):** see Multiplayer boundary.
