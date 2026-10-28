# 14: Battle System & the Showdown Fork

> **TL;DR:** Build a **BattleService** inside the engine that owns live Showdown battles keyed by `battleId`. It handles choices, timers, AI players, rendering events, persistence/recovery (Showdown battles are deterministic from seed + input log), and results flowing back into the engine. **Rebase the fork onto current upstream and shrink it** to a thin, well-named patch set (state injection, bag/catch/run choice hooks) with all custom content moved into a **mod**. PvP-first sequencing is a good call: PvP needs none of the sim patches, so you can ship the Arena while the wild-battle hooks are designed.

**MVP impact:** Very high · **Cost to change later:** High

## Current state of the fork
- Based on upstream as of **Aug 2023**, so about three years of mechanics fixes, data, and Gen 9 DLC content are missing.
- Custom work:
  - New Logora fakemon edited **into base `data/pokedex.ts` / `learnsets.ts` / `moves.ts`**. Every upstream rebase conflicts.
  - `updatePlayerState` stream command (HP/status injection at battle start).
  - `secondaryChanceCallback` hook.
  - Exports for `moves` and AI.
  - Debug `pause`/`sendToJSON` code in `battle-stream.ts`, which should not ship.
- Not yet consumed by `pokesandbox`.

## What Showdown does vs what PokeSandbox must do

| Concern | Showdown | PokeSandbox |
|---|---|---|
| Damage, abilities, items-in-battle, turn order, formats, team validation | ✅ | — |
| Starting a battle with **persistent HP/status/PP** | ❌ (full HP by default) | Patch or construct-and-mutate before turn 1 |
| **Bag items in battle** (Potion, X Attack, Full Heal) | ❌ in normal formats | Custom choice type → apply effect → consume the player's turn |
| **Catching** (throw ball, catch formula, shakes) | ❌ | Custom choice type → engine computes the catch → end battle or consume turn |
| **Running** from wild battles (escape odds) | ❌ (only forfeit) | Custom choice → engine computes odds → end battle or consume turn |
| EXP, level-up, move learning, evolution | ❌ | Engine (post-faint/post-battle) |
| Trainer AI | Only `RandomPlayerAI` | Engine AI players (see below) |
| Persistence across restarts | Battles are deterministic from seed + input log, and `sim/state.ts` serializes | BattleService persists the log/snapshot each turn |
| Rendering | Protocol messages (`|move|p1a: Pikachu|…`) | Discord renderer (per-turn embed, HP bars, ephemeral choice prompts) |

## Fork strategy options

| Option | Pros | Cons |
|---|---|---|
| A. Keep the current fork as is | No work now | 3 years stale and growing. Base-data edits make every rebase painful. Custom fakemon block upstream fixes. |
| **B. Rebase onto upstream + thin patch set + content as mod** (recommended) | Easy future rebases (patches are small and localized). Custom species live in `data/mods/…`. You can track upstream monthly. | One-time rebase effort. Need to define the custom choice hooks well. |
| C. Use the upstream npm package + `patch-package` | No fork repo at all | Patches against compiled `dist/` are brittle. Mods inside node_modules are awkward. |
| D. Upstream package, no patches (construct `Battle` directly and mutate state; implement bag/catch/run by intercepting choices and calling sim internals) | Zero fork | Leans on private internals, so upgrades break silently. Bag/catch need turn consumption, which is hard without a sim hook. |

**Recommended patch set** (keep each in its own file/commit with tests):
1. **State injection:** set HP/status/PP (and level/EXP-derived stats) before the first turn and mid-battle (for level-ups if you want them mid-battle, and for the community-boss shared HP pool).
2. **External choice hook:** a generic `choice: external <payload>` that ends the player's action for the turn without moving, letting the engine apply an outcome (heal, stat stage, catch result) via injection before the turn resolves. Bag, catch, and run all use this one hook.
3. **Battle end with custom reason:** `caught` / `ran` as clean end states.
4. Remove debug code. Move New Logora into `data/mods/newlogora` (or a PokeSandbox mod) as the prototype for compiled custom content ([12](12-content-catalog-species-moves-items.md)).

## BattleService (engine)
```ts
BattleService.start({ kind: 'wild' | 'trainer' | 'pvp' | 'ai-arena', sides, format, rules, seed }) → battleId
BattleService.choose(battleId, sideId, choice)        // validates against the current request
BattleService.on(battleId, handler)                    // protocol → GameEvents
BattleService.recover()                                // on boot: rebuild live battles from persisted seed + inputLog
```
- **Process model:** in-process for MVP. Put it behind an interface so battles can move to worker threads/processes when CPU becomes a concern (AI search and many concurrent battles). Showdown's own server runs battles in child processes.
- **Timers:** per-side choice deadline (configurable). On timeout: PvP uses the default choice, or loss after N timeouts; PvE pauses (no timer) since adventure play is async.
- **Persistence:** store `{ battleId, seed, formatId, teams (input), inputLog[], status }` in a `Battle` collection, updated after each turn. Recovery replays the log. This also gives **replays** for free, and "battle history" for the webapp roadmap item.
- **Spectating:** PvP renders to a public channel message (edited per turn). Choices go to ephemeral prompts for each player. This is the multi-user FlowCord capability you discussed in your Alpha-strategy chat.

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
  rules: { mechanicsGen; level: 'as-built' | 50 | 100 | { max: number }; gameType: 'singles' | 'doubles'; clauses: string[]; teamSize; pickN?; timer };
}
```

- **Built-in formats** (e.g. National Dex Lv50, a Gen 1 151 format) ship by default, so the Arena works on a fresh server with zero setup.
- Admins can create server formats that mix canon and **server library** content (see [12](12-content-catalog-species-moves-items.md#server-content-library-decided-oct-2026)). `fromRegionDex` is just a convenience source. A format never depends on a region being deployed.
- Compiles to its own Showdown mod + custom format (canon + selected library entries + overrides), so `TeamValidator` enforces it. See [12 § Species identity](12-content-catalog-species-moves-items.md#species-identity-canon-custom-species-variants-overrides--sharing-proposed-oct-2026).
- Pausing a region has **no effect** on Arena battles. (Only Phase 3 in-game PvP with *adventure parties* is region-bound.)

## AI trainers
Your roadmap wants the Arena to double as the AI playtest surface. Good instinct. Plan AI as **profiles**:

| Profile | Behavior | Use |
|---|---|---|
| `random` | Showdown RandomPlayerAI | Youngsters, debug |
| `basic` | Highest expected damage move (via `@smogon/calc`), never switches | Route trainers |
| `smart` | Type-aware switching, status moves when sensible, items at low HP | Gym leaders, rival |
| `champion` | 1–2 ply lookahead with the damage calc, prediction heuristics | Elite 4, Arena "hard" |

The AI implements the same `choose()` interface as a human side. Arena PvAI with "pick tier" is just a format plus an AI profile.

## Battle → engine results
On end, BattleService emits `battleEnded { result, sides[].pokemon[].{hp,status,pp}, faints[], turns, caught?, ran? }`. The engine then:
1. Writes persistent state back to PokemonInstances.
2. Computes EXP shares (participants, Exp. Share rule), level-ups → move-learn prompts → evolutions (blocking interactions).
3. Applies trainer rewards (money formula and effects), sets defeat flags, resumes the script (`onWin`/`onLose`).
4. On loss with `canLose: false`: **whiteout** (lose money per rule, heal, move to respawn).

## Open questions
- **Mechanics generation:** RBY content with *modern* mechanics (Fairy type, physical/special split, Gen 9 moves), or authentic Gen 1 mechanics (Showdown has a `gen1` mod)? Per-region rule? (This is the biggest battle-related decision.)
- **Mid-battle level-ups** (authentic: stats update immediately) vs post-battle (simpler)? Recommendation: post-battle for MVP, with the injection hook designed to allow mid-battle later.
- ~~Is the Arena per-region or server-wide?~~ Decided: server-scoped formats (see Arena formats above); Arena works before any region exists.
- Level normalization for Arena (all level 50/100?) and **clauses** (species, sleep, OHKO)?
- Who owns the fork after the org move? Same org, renamed `pokesandbox-showdown`?
