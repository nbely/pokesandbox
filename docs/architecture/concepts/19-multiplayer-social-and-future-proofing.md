# 19: Multiplayer, Social & Future-Proofing

> **TL;DR:** None of the Full-Feature or Pie-in-the-Sky items need to be *built* in MVP. A handful of MVP decisions decide whether they're additive or a rebuild. This doc maps each later feature to the MVP decision that unblocks it.

| Later feature (from your roadmap) | Needs | MVP decision that unblocks it |
|---|---|---|
| In-game PvP with adventure parties | Party → battle set conversion, multi-user battle UI | PokemonInstance in Showdown set shape ([13](13-characters-and-pokemon-instances.md)). The Arena builds the multi-user BattleService ([14](14-battle-system-and-showdown.md)). |
| Wonder Trade, GTS, cross-region trades (player-to-player trading is MVP, see [13](13-characters-and-pokemon-instances.md#trading-decided-oct-2026-mvp-q35)) | Moving Pokémon between owners atomically | Separate PokemonInstance collection + transactions ([13](13-characters-and-pokemon-instances.md), [15](15-persistence-caching-concurrency.md)) |
| Breeding (contained / server pool) | Pokémon storage outside party/box, egg instances | `storage.kind` union (`daycare`, `pool`) ([13](13-characters-and-pokemon-instances.md)) |
| Quest engine v2 (active/passive, loaners, quiz, RP-hurdle stages) | Composable sequences, persistence, objective tracking | Script VM + mode machine + engine events ([07](07-scripts-triggers-and-events.md), [03](03-engine-boundary-and-game-loop.md)) |
| Persistent dialogue choices | Choice storage readable everywhere | `choice` progression kind + Condition predicate ([04](04-progression-and-flags.md), [05](05-requirements.md)) |
| Server events, giveaways, plot NPC chance encounters, event islands | Server-scoped state, scheduled publishes, triggers with chance, content shared by every region | `ServerState` (and `RegionState` for single-region events), **event regions** that journeys visit ([13](13-characters-and-pokemon-instances.md#event-regions-and-visiting-post-mvp)), `chance` predicate, triggers ([07](07-scripts-triggers-and-events.md)) |
| Community boss (shared HP pool) | HP injection mid-battle, server-scoped counter | Patch set's state-injection hook ([14](14-battle-system-and-showdown.md)) + `ServerState` or `RegionState` |
| Weather/terrain by location | Conditions on encounters, battle field state at start | Encounter conditions ([10](10-encounters.md)), battle start options in BattleService |
| Custom fakemon/types/moves | Custom data reaching Showdown without forking base files | Isolated custom-data dexes (fork patch 4), built in M1 for Gen 1 data and Arena formats ([12](12-content-catalog-species-moves-items.md), [14](14-battle-system-and-showdown.md)) |
| Staff ops (grant items/Pokémon/money) | Audited state mutations | "Staff applies effects to journey" = Effect executor + audit log ([06](06-effects.md)) |
| Webapp character sheet (per journey), battle/RP history, activity log | Event history | Permanent **adventure log** with turn digests ([22](22-adventure-log-and-narration.md)) |
| Webapp as play surface | Client-agnostic rules | `libs/engine` ([03](03-engine-boundary-and-game-loop.md)) |
| Co-op story, multi battles | Multiple journeys in one script/battle | Script `mode` keyed by a **session** that can hold N journeys (design the mode record with `participants[]` from day one, even if MVP always has 1) |
| Cross-region / cross-server travel | A persona that outlives a region | **Character** (persona) separate from **Journey** (one region's playthrough); original trainer recorded as the character; Pokémon move between journeys via `ownerJourneyId` ([13](13-characters-and-pokemon-instances.md#characters-and-journeys-decided-oct-2026)). Showdown IDs for species ([02](02-identity-and-references.md)). |
| Energy/pacing system (storytelling servers) | Action costs, regenerating energy, narration refunds | Action-cost hook in `dispatch` (returns 0 in MVP) + `RegionRules.systems.pacing` (see below) |
| Pluggable RP adjudication (mod queue / AI judge) | A blocking step that waits on an *external* decision | Script step `await: { kind: 'approval' }`. Same mode/persistence machinery, resumed by a staff/AI action instead of the player. |
| AI enrichments (BYO key) | Hooks around dialogue and battle text | Renderers consume `GameEvent`s, so an optional "narrator" decorator can rewrite text without touching rules |

## Cheap insurance to add in MVP
1. `participants: JourneyId[]` on script/battle mode records (co-op later).
2. Permanent `AdventureLogEntry` collection written from MVP (narration attaches later; see [22](22-adventure-log-and-narration.md)).
3. Audit log for admin/staff mutations (who changed what, when).
4. `RegionState` and `ServerState` docs reserved (even if empty), see [04](04-progression-and-flags.md#living-region-shared-state-post-mvp-direction-oct-2026).

## Energy / pacing for storytelling servers (post-MVP design notes, Oct 2026)
**Why a server might want it:** it paces players so they write between actions instead of grind-racing. It keeps a community at a similar point in the story, limits facilitator load in moderated modes, and nudges toward the forum-RPG rhythm.

```ts
RegionRules.systems.pacing?: {
  mode: 'off' | 'daily' | 'regen';             // daily reset vs gradual regeneration (regen avoids "log in at reset" pressure)
  scope: 'journey' | 'user';                  // per journey, or per user across regions (prevents alt-region farming)
  capacity: number;                             // max energy
  refill: { perDay?: number; perHours?: { amount: number; every: number } };
  costs: Partial<Record<GameActionType, number>>;   // e.g. explore 1, trainer battle 2, travel 0; menus/party/shop/heal/narration free
  narrationRefund?: { minWords: number; amount: number; dailyCap: number; requiresApproval?: boolean };   // "narrate to recharge"
}
```
- **Narrate to recharge** ties progress to storytelling: a narration of N+ words on a log entry refunds energy, with a daily cap. Low-effort spam is the risk, so optionally require facilitator or AI approval (reuses RP adjudication).
- **Implementation:** store `energy` + `updatedAt` and compute regeneration lazily on read (no cron). `dispatch` checks the action cost before executing and explains shortfalls ("Your team needs rest. 3 energy at 6pm").
- **Risks:** a mobile-game feel and frustration for players who want long sessions. Keep it strictly **opt-in per server/region**, off by default.
- **MVP hook:** the action-cost step exists in `dispatch` and always returns 0.
