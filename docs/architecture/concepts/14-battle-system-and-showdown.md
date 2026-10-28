# 14: Battle System & the Showdown Fork

> **TL;DR:** Build a **BattleService** inside the engine that owns live Showdown battles keyed by `battleId`. It handles choices, timers, AI players, rendering events, persistence/recovery (Showdown battles are deterministic from seed + input log), and results flowing back into the engine. **Rebase the fork onto current upstream and shrink it** to a thin, well-named patch set (state injection, bag/catch/run choice hooks) with all custom content moved into a **mod**. PvP-first sequencing is a good call: PvP needs none of the sim patches, so you can ship the Arena while the wild-battle hooks are designed.

**MVP impact:** Very high · **Cost to change later:** High

## Current state of the fork (branch inventory, Oct 2026)

Upstream base: `2557b66` (smogon/pokemon-showdown, **2023-08-04**). The custom commits were rebased onto it on 2023-08-05.

| Branch | Status | Unique content |
|---|---|---|
| `master` | Default | See "What master changes" below |
| `dynamic-dex-data` | **Unmerged**, 2 commits ahead (2023-08-06) | Proof of concept: inject custom dex data **at battle start** instead of hardcoding it |
| `fix-lint-issues` | Squash-merged as #7, no unique content left | — |
| `rebase/8-5-23` | Fully contained in `master` | — |

### What `master` changes vs upstream (13 files, +527/−93)
- **New Logora species are already gone.** #7 reverted `data/pokedex.ts`, `learnsets.ts`, and `text/pokedex.ts` back to upstream (CAP species restored), so no custom species are hardcoded.
- **10 custom moves are still hardcoded** in `data/moves.ts` + `data/text/moves.ts` (negative `num`s): Coal Scatter, Drain Life, Eagle Eye, Germ Spray, Mach Turn, Nip, Para Needle, Piston Kick, Psych Out, Shadow Dart.
  - Side effect: inserting moves into the base move table shifts Metronome's random pool, so **3 upstream tests were commented out** (`twoturnmoves`, `counter`, `mirrormove`) with "put back once updating the seed is figured out". This is the concrete cost of editing base data.
- **`secondaryChanceCallback`** hook in `battle-actions.ts` + type in `dex-moves.ts`. It's used by one custom move. Keep it as a small patch, or drop it with the moves.
- **`updatePlayerState`** stream command. It sets **HP only** (no status, despite the commit message), and **only for side `p1`**. It's the seed of patch #1 below, but needs generalizing.
- **Debug code** in `battle-stream.ts`: `pause`, `resume`, `sendToJSON`. Remove.
- **Exports:** `RandomPlayerAI` and `Moves` from `sim/index.ts`. `build` refactored into a callable `buildSimulator()`.
- Example scripts updated (AI vs player).

### `dynamic-dex-data` (the POC)
- `BattleOptions.customData?: { Dex: DexTableData; Text: TextTableData }` is passed in the `start` message. `Dex.forFormat(format, customData)` → `ModdedDex.loadCustomData()` `Object.assign`s it into the dex's data and text caches.
- The example injects a fakemon (`Acafia`) keyed by **Discord guild ID + name** (`1010726453974925402acafia`), plus its learnset.
- **The idea is right and better than generated mod files:** content comes from the release/format at battle start, with no files written, no restarts, and no rebuilds. It replaces the "generated mod files" approach in [12](12-content-catalog-species-moves-items.md) as the preferred path.
- **Issues to fix before relying on it:**
  1. **Global mutation.** It merges into the shared, process-wide dex cache, so custom data leaks into every later battle in the process (other servers and regions included). Needs **isolated dex instances**: a fresh `ModdedDex` (child of the right gen mod) per *content set*, cached by content hash (release version / format version), never touching base.
  2. **First-load-wins flag.** `customDataLoaded` is set once per dex, so a second battle with *different* custom data is silently ignored.
  3. **Load-order dependency.** If the base `dataCache` isn't loaded yet when `loadCustomData` runs, `this.dataCache?.[type]` is undefined. Nothing merges, but the flag still flips to loaded. It only works in the example because `Teams.generate` loads data first.
  4. **Mods don't see it.** It merges into the dex `forFormat` is called on (base), while formats that use a mod (e.g. gen 1) resolve a different, already-built dex.
  5. **Key vs name.** The table key (`1010…acafia`) doesn't equal `toID(name)` (`acafia`). Showdown derives IDs from names in several places (species/learnset lookups, the validator), so this likely breaks outside the happy path. **Verify during the spike.** The compiler should emit keys as `toID(displayName)` within each isolated dex and keep a translation table to our species IDs (see [12](12-content-catalog-species-moves-items.md)).
  6. **TeamValidator** doesn't receive custom data, so Arena team validation needs the same isolated dex.
  7. Species, move, and learnset object caches (`speciesCache`, etc.) need to live per isolated dex too.

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
1. **State injection:** generalize `updatePlayerState` to any side and to HP/status/PP/level/stats/move slots, both before the first turn and **mid-battle** (required for immediate level-ups, see Decisions; also used by the community-boss shared HP pool).
2. **External choice hook:** a generic `choice: external <payload>` that ends the player's action for the turn without moving, letting the engine apply an outcome (heal, stat stage, catch result) via injection before the turn resolves. Bag, catch, and run all use this one hook.
3. **Battle end with custom reason:** `caught` / `ran` as clean end states.
4. **Isolated custom-data dexes:** evolve the `dynamic-dex-data` POC into per-content-set isolated `ModdedDex` instances (cached by content hash) used by both `Battle` and `TeamValidator`. This is how server library content, overrides, and Arena formats reach Showdown ([12](12-content-catalog-species-moves-items.md)).
5. **Clean-up:**
   - Remove the debug code.
   - Move the 10 hardcoded custom moves out of base data (into injected custom data, i.e. a library), or drop them. Then restore the 3 commented-out upstream tests.
   - Keep `secondaryChanceCallback` only if those moves stay.

## Decisions (Oct 2026)
- **Strategy:** rebase onto current upstream and apply the revised patch set above. **Fallback:** if the rebase is painful, start fresh from upstream `master` and re-apply only the patches we keep, as new, clean commits. Either way, the end state is upstream + a small, named patch set.
- **Custom moves:** the 10 hardcoded moves go to a separate preservation branch (e.g. `archive/new-logora-moves`) and are **removed from `master`**. The 3 commented-out upstream tests are restored. Designing custom moves that reuse Showdown's internal mechanics and load dynamically (like the isolated custom-data dex) is deferred to the custom-moves/abilities/items work (post-MVP). `secondaryChanceCallback` goes with the moves unless that design needs it.
- **Repo:** renamed to `pokesandbox-showdown` after the org move.
- **Upstream sync:** a scheduled monthly sync PR.
- **Consumption:** the monorepo depends on the fork as a **versioned package** (git tag or GitHub Packages release), not a git submodule.
- **Mid-battle level-ups (Q8):** the engine awards EXP on `faint` events (all participants, plus Exp. All/Share per rules). On level-up it injects the new level and recalculated stats (max HP grows, and current HP rises by the same amount) through the state-injection patch, which must therefore support **mid-battle level/stat/move-slot updates**, not just battle-start state. A new move is a **blocking prompt inside the battle**: BattleService holds the side's next request until the player learns, replaces, or skips the move, then injects the move-slot change. **Evolution never happens in the sim.** It's evaluated post-battle by the engine (level/stone/etc.) and runs as a blocking post-battle interaction.

## Package placement (decided Oct 2026): its own library, `libs/battle`
The Showdown integration is a **separate library from the game engine**:
- **Dependencies:** it's the only code that needs the Showdown fork and `@smogon/calc`, both heavy. The webapp embeds `libs/engine` for QoL actions and must not bundle a battle simulator.
- **Different lifecycle:** battles are stateful and long-lived, run in worker threads, and exist in exactly one game host process. Engine actions are short and stateless.
- **The Arena doesn't need the adventure engine:** PvP/PvAI with team presets uses `libs/battle` plus a thin Arena module, with no world state.
- **Most likely future split:** if anything moves into its own container first, it's the battle host (sharding, CPU-heavy AI).

**How the engine and battles talk** (ports, serializable data, both directions):
```ts
// defined by libs/engine, implemented by libs/battle (wired in apps/bot)
interface BattlePort {
  start(spec: BattleSpec): Promise<BattleId>;                  // sides (PokemonSet + persistent state), format/rules data, AI profiles, seed
  choose(id: BattleId, side: SideId, choice: string): Promise<void>;
  inject(id: BattleId, patch: StatePatch): Promise<void>;     // mid-battle level-ups, move learning, boss HP
  subscribe(id: BattleId, sink: (e: BattleEvent) => void): Unsubscribe;
}
// libs/battle calls back into the game only via an injected resolver for external choices:
interface ExternalActionResolver { resolve(ctx: ExternalActionContext): Promise<ExternalOutcome> }  // bag item, catch, run → engine applies rules (catch formula, item effects)
```
- `libs/battle` emits `BattleEvent`s (move, damage, `faint`, request-for-choice, ended). The engine reacts, e.g. on `faint` it computes EXP with `libs/core` formulas and calls `inject(levelUp)`. Battle code never computes EXP or reads characters.
- Catch/escape/item formulas live in `libs/core` (pure). The engine's `ExternalActionResolver` uses them, so the battle library stays free of game rules.

## BattleService (in `libs/battle`)
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
- ~~Mid-battle vs post-battle level-ups?~~ **Decided: mid-battle (authentic).** Stats, max HP (current HP raised by the gain), and new-move prompts apply immediately during the battle. Evolution is evaluated post-battle by the engine, never in the sim.
- ~~Is the Arena per-region or server-wide?~~ Decided: server-scoped formats (see Arena formats above); Arena works before any region exists.
- Level normalization for Arena (all level 50/100?) and **clauses** (species, sleep, OHKO)?
- Who owns the fork after the org move? Same org, renamed `pokesandbox-showdown`?
