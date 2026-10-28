# 22: Adventure Log & Narration

> **TL;DR (proposed Oct 2026):** Make the **adventure log a first-class, permanent record** of a character's journey, not a disposable activity feed. The engine writes compact log entries (battles with a turn-by-turn digest, catches, travel, story scenes, milestones). **Narration** (player prose, moderator or GM posts, later AI) attaches to entries, either during play or after the fact. Opponent Pokémon are **ephemeral**: they're created from authored recipes for the battle and discarded unless caught. Only player-owned Pokémon persist. This is the project's roots in forum text-RPGs, built into the data model from day one.

**MVP impact:** Medium (the log is written from MVP; the narration UI comes later) · **Cost to change later:** High (history that wasn't recorded can't be recovered)

## Why this matters for PokeSandbox specifically
PokeSandbox grew out of forum text-RPGs. Players narrated their adventures in threads, and volunteer moderators used damage calculators to resolve battles and post stepwise updates. It served writing-minded Pokémon fans who wanted community and story more than ROM hacking. The engine now does the moderator's math. **The story layer is the differentiator**, and it only works if the game keeps a faithful, narratable record of what happened.

## Records and their lifetimes

| Record | Contents | Lifetime |
|---|---|---|
| **Opponent Pokémon** (wild, trainer) | Instantiated from the **recipe**: an encounter slot + RNG, or the trainer party variant. Lives only inside the battle (BattleSpec + Showdown state). | **Ephemeral.** Gone when the battle ends. **If caught**, it becomes a `PokemonInstance` (the only path into persistence). |
| **Player-owned Pokémon** | `PokemonInstance` | Permanent (released = soft-deleted, purged after 30 days) |
| **Battle record (full fidelity)** | Seed, BattleSpec, input log. Can regenerate the exact battle. | Needed during the battle for crash recovery. Afterwards: **compressed** (~2–5 KB) and kept for a window (default **90 days**, configurable; PvP/Arena for replays). Exact replay also needs the same Showdown version + release data, which are pinned for that window. |
| **Adventure log entry (low fidelity)** | Compact, version-independent summary of what happened | **Permanent** |
| **Narration** | Prose attached to a log entry (or a specific turn) | **Permanent** (author-editable) |

## Adventure log entry
```ts
AdventureLogEntry {
  _id; characterId; regionId; at: Date; releaseVersion;
  kind: 'trainerBattle' | 'wildBattle' | 'catch' | 'travel' | 'scene' | 'milestone' | 'evolution' | 'moveLearned'
      | 'gift' | 'pvp' | 'whiteout' | 'rollup';
  location: ContentKey;
  summary: {                                   // version-independent, display-ready data
    opponent?: { trainerKey?; name; class?; party: { species; level }[] };
    outcome?: 'win' | 'loss' | 'caught' | 'ran' | 'draw';
    participants?: PokemonInstanceId[];        // the player's Pokémon involved
    turns?: TurnDigest[];                      // trainer battles: per-turn digest (see below)
    highlights?: string[];                     // generated: "Pikachu landed a critical hit", "Charmander grew to Lv. 16"
    rewards?: { money?; items?; milestones? };
  };
  refs?: { battleRecordId?; scriptKey?; tradeId? };
  narrationCount: number;
}

TurnDigest { turn: number; actions: { side; pokemon; action: 'move' | 'switch' | 'item' | 'catch' | 'run'; detail; result: { damagePct?; ko?; crit?; effectiveness?; status? } }[] }
```
- **Trainer battles, PvP, catches, story scenes, milestones, evolutions:** one entry each. Trainer battles keep the **turn digest** (~100–300 bytes/turn), which is enough to narrate turn by turn after the fact, even once the full battle record has expired.
- **Defeated wild Pokémon:** **rolled up** per visit ("Defeated 6 wild Pokémon on Route 1: Pidgey ×4, Rattata ×2") to keep volume sane. Catches always get their own entry.
- Written by the engine from domain events, inside the same transaction as the state change, so the log never disagrees with the game.

## Narration
```ts
Narration {
  _id; entryId; turn?: number;                 // attach to a whole entry or one turn of a battle
  authorUserId; role: 'player' | 'moderator' | 'gm' | 'ai';
  text: string; createdAt; editedAt?;
  visibility: 'public' | 'private';           // respects character privacy (13)
}
```
- **During play or after the fact.** A player can narrate a battle live in their thread or return a week later and write it up. Entries are permanent and have stable IDs, so narration can always attach.
- **Multiple voices** per entry: the player's prose, a moderator or GM response, later AI narration (BYO key) as a draft the player can accept or edit.
- **Discord threads mode (Q2) is the forum thread reborn:** the bot posts log entries into the player's adventure thread, the player's replies in that thread can be captured as narration on the latest entry, and the webapp renders the whole adventure as a readable story page.

## Future: narrated battle mode (the forum model, with the engine as calculator)
The original forum flow (player narrates a move, moderator resolves it with a calculator and posts the outcome) maps onto existing pieces:
- Showdown is the calculator. **BattleService gets a turn-gating hook:** a battle can be configured to **hold each turn's resolution until required narration and/or approval arrives** (player narration, GM ruling).
- GM/approver roles reuse the **pluggable RP adjudication** design (participant vs approver; mod, AI, or both).
- Reserve the hook now (`BattleSpec.turnGate?: { requireNarration?: Role[]; requireApproval?: Role }`). Build it with RP quests.

## Storage impact (estimates)
- Log entries: ~0.5–2 KB (trainer battles with digests are at the top end). With wild-battle rollups, an active player writes ~5–15 KB/day. That's ~100 active players ≈ **0.2–0.5 GB/year**: Free tier for the MVP period, Flex/DO-managed (~$15) for the first public year.
- Narration: depends on how much people write. Text is small and compresses well. Even prolific writers add MBs, not GBs.
- Compressed battle records for 90 days: ~100 players × 30 battles × 3 KB × 90 days ≈ 0.8 GB at heavy play. **Tunable:** shorten the window or keep full records only for trainer/PvP battles if storage gets tight. The permanent log doesn't depend on them.

## MVP scope
- Ephemeral opponent Pokémon (recipes → battle-only; catch → PokemonInstance).
- `AdventureLogEntry` written by the engine (trainer battles with turn digests, catches, wild rollups, milestones, evolutions, scenes).
- Compressed battle records with a retention window.
- A basic adventure log view on the webapp character page.
- Later: Narration model + UI (webapp first, then thread capture), AI narration drafts, narrated battle mode.

## Open questions
- Who can narrate on a character's entries: owner only, owner + server moderators, or invited co-authors (co-op)?
- Should narration be able to **feed back into the game** (e.g. RP-hurdle approvals unlocking rewards), or stay purely cosmetic until RP quests exist?
- Default retention window for full battle records: 90 days OK, or keep trainer-battle records forever (more storage) for exact replays?
