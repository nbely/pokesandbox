# 22: Adventure Log & Narration

> **TL;DR (decided Oct 2026):** Make the **adventure log a first-class, permanent record** of a character's journey, not a disposable activity feed. The engine writes compact log entries (battles with a turn-by-turn digest, catches, travel, story scenes, milestones). **Narration** (player prose, moderator or GM posts, later AI) attaches to entries, either during play or after the fact. Opponent Pokémon are **ephemeral**: they're created from authored recipes for the battle and discarded unless caught. Only player-owned Pokémon persist. This is the project's roots in forum text-RPGs, built into the data model from day one.

**MVP impact:** Medium (the log is written from MVP; the narration UI comes later) · **Cost to change later:** High (history that wasn't recorded can't be recovered)

## Why this matters for PokeSandbox specifically
PokeSandbox grew out of forum text-RPGs. Players narrated their adventures in threads, and volunteer moderators used damage calculators to resolve battles and post stepwise updates. It served writing-minded Pokémon fans who wanted community and story more than ROM hacking. The engine now does the moderator's math. **The story layer is the differentiator**, and it only works if the game keeps a faithful, narratable record of what happened.

## Records and their lifetimes

| Record | Contents | Lifetime |
|---|---|---|
| **Opponent Pokémon** (wild, trainer) | Instantiated from the **recipe**: an encounter slot + RNG, or the trainer party variant. Lives only inside the battle (BattleSpec + Showdown state). | **Ephemeral.** Gone when the battle ends. **If caught**, it becomes a `PokemonInstance` (the only path into persistence). |
| **Player-owned Pokémon** | `PokemonInstance` | Permanent (released = soft-deleted, purged after 30 days) |
| **Battle record (full fidelity)** | Seed, BattleSpec, input log. Can regenerate the exact battle. | **Adventure battles:** needed only while live (crash recovery), then kept compressed for a short **support window (7 days)** for bug reports/disputes, then deleted. The turn digest is the permanent record (decided Oct 2026). **Arena/PvP:** kept per the replay policy. |
| **Adventure log entry (low fidelity)** | Compact, version-independent summary of what happened | **Permanent** |
| **Narration** | Prose attached to a log entry (or a specific turn) | **Permanent** (author-editable) |

## Adventure log entry
```ts
AdventureLogEntry {
  _id; journeyId; regionId; at: Date; releaseVersion;
  kind: 'trainerBattle' | 'wildBattle' | 'catch' | 'travel' | 'scene' | 'milestone' | 'evolution' | 'moveLearned'
      | 'gift' | 'trade' | 'release' | 'pvp' | 'whiteout' | 'rollup';
  location: ContentKey;
  summary: {                                   // version-independent, display-ready data
    opponent?: { trainerKey?; name; class?; party: { species; level }[] };
    outcome?: 'win' | 'loss' | 'caught' | 'ran' | 'draw';
    participants?: PokemonSnapshot[];          // the player's Pokémon involved (snapshots, not bare IDs)
    pokemon?: PokemonSnapshot[];               // release/trade/gift/catch/evolution: the Pokémon the entry is about
    turns?: TurnDigest[];                      // trainer battles: per-turn digest (see below)
    highlights?: string[];                     // generated: "Pikachu landed a critical hit", "Charmander grew to Lv. 16"
    rewards?: { money?; items?; milestones? };
  };
  refs?: { battleRecordId?; scriptKey?; tradeId? };
  narrationCount: number;
}

PokemonSnapshot { instanceId?: PokemonInstanceId; species: SpeciesId; nickname?: string; level: number; form?: string; shiny?: boolean }
// Display data captured when the entry is written. instanceId is only a link: it may point at nothing once a released Pokémon is purged.

TurnDigest { turn: number; actions: { side; pokemon; action: 'move' | 'switch' | 'item' | 'catch' | 'run'; detail; result: { damagePct?; ko?; crit?; effectiveness?; status? } }[] }
```
- **Entries never depend on live Pokémon data.** Every Pokémon an entry mentions is stored as a `PokemonSnapshot` taken at write time, so the log stays complete after a released Pokémon is purged (30 days, [13](13-pokemon-instances-and-trading.md#decisions-oct-2026-q22)) or after a trade moves it to another owner.
- **Releases** get their own entry ("Released Pidgey (Lv. 12), caught on Route 1"). The Pokémon sent away in an in-game NPC trade appears in that `trade` entry.
- **Trainer battles, PvP, catches, story scenes, milestones, evolutions:** one entry each. **Turn digests** (~100–300 bytes/turn) are kept for trainer battles, **catches** (the whole wild battle that ended in the catch), and other notable wild battles: scripted/static encounters (Snorlax, legendaries) and battles where the player's Pokémon fainted or the player whited out. That's enough to narrate turn by turn after the fact.
- **Ordinary defeated wild Pokémon:** **rolled up** per visit ("Defeated 6 wild Pokémon on Route 1: Pidgey ×4, Rattata ×2") to keep volume sane. Catches always get their own entry.
- Written by the engine from domain events, inside the same transaction as the state change, so the log never disagrees with the game.

## Narration
```ts
Narration {
  _id; entryId; turn?: number;                 // attach to a whole entry or one turn of a battle
  authorUserId; role: 'player' | 'coauthor' | 'narrationModerator' | 'ai';
  text: string; createdAt; editedAt?;
  visibility: 'public' | 'private';           // respects character privacy (23)
}
```
- **During play or after the fact.** A player can narrate a battle live in their thread or return a week later and write it up. Entries are permanent and have stable IDs, so narration can always attach.
- **Multiple voices** per entry: the player's prose, co-authors' prose, a narration moderator's (GM-style) response, later AI narration (BYO key) as a draft the player can accept or edit.
- **Discord threads mode (Q2) is the forum thread reborn:** the bot posts log entries into the player's adventure thread, the player's replies in that thread can be captured as narration on the latest entry, and the webapp renders the whole adventure as a readable story page.

## Future: narrated battle mode (the forum model, with the engine as calculator)
The original forum flow (player narrates a move, moderator resolves it with a calculator and posts the outcome) maps onto existing pieces:
- Showdown is the calculator. **BattleService gets a turn-gating hook:** a battle can be configured to **hold each turn's resolution until required narration and/or approval arrives** (player narration, a narration moderator's ruling).
- Narration moderator / approver roles reuse the **pluggable RP adjudication** design (participant vs approver; mod, AI, or both).
- Reserve the hook now (`BattleSpec.turnGate?: { requireNarration?: Role[]; requireApproval?: Role }`). Build it with RP quests.
- Narrated regions may want slower-paced progression rules, such as percentage EXP, fixed stat investment, or catch modifiers from battle effects. These are candidate `RegionRules` options ([18 § Candidate options](18-rules-time-and-randomness.md#candidate-post-mvp-options-not-decided)).

## Storage impact (estimates)
- Log entries: ~0.5–2 KB (trainer battles with digests are at the top end). With wild-battle rollups, an active player writes ~5–15 KB/day. That's ~100 active players ≈ **0.2–0.5 GB/year**: Free tier for the MVP period, Flex/DO-managed (~$15) for the first public year.
- Narration: depends on how much people write. Text is small and compresses well. Even prolific writers add MBs, not GBs.
- Compressed adventure battle records for a 7-day support window: ~100 players × 30 battles × 3 KB × 7 days ≈ 60 MB at heavy play. The permanent log doesn't depend on them.

## Decisions (Oct 2026)
- **Full battle records outside the Arena are not kept long term.** The turn digest is sufficient. Full records exist for crash recovery while a battle is live, plus a 7-day support window for bug reports and disputes.
- **Catches get full turn digests**, as do other notable wild battles (static/scripted encounters, faints/whiteouts). Ordinary defeated wild Pokémon roll up.
- **All narration is post-MVP**, by players and facilitators alike. **Logging starts at MVP** so the history exists from day one.

## MVP scope
- Ephemeral opponent Pokémon (recipes → battle-only; catch → PokemonInstance).
- `AdventureLogEntry` written by the engine (trainer battles with turn digests, catches, trades, releases, wild rollups, milestones, evolutions, scenes), with Pokémon stored as snapshots.
- Compressed battle records for live recovery + a 7-day support window (Arena replays per policy).
- A basic adventure log view on the webapp character page, per journey.
- Later: Narration model + UI (webapp first, then thread capture), AI narration drafts, narrated battle mode.

## Open questions (post-MVP)
- ~~Who can narrate?~~ **Decided (Oct 2026, post-MVP):** the character's owner and co-authors they invite. A dedicated server role, **narration moderator**, can write, edit, and hide narration on *anyone's* story in that server (GM-style). Regular moderators can only hide entries.
- ~~Narration feeding back into the game?~~ **Decided for MVP and the first narration release (Oct 2026): cosmetic only.** Narration itself is post-MVP, so the MVP has nothing to feed back. This isn't a permanent assumption. A far-future direction is **configurable narration effects**: a server or region chooses what approved roleplay can do, e.g. friendship rises faster, or a wild Pokémon the player is searching for becomes easier to find. Approval would use the script approval step ([19](19-multiplayer-social-and-future-proofing.md)). Nothing in the MVP model should assume narration is cosmetic forever.
