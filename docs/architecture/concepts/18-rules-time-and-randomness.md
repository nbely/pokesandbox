# 18: Region Rules, Time & Randomness

> **TL;DR:** Replace `baseGeneration` and scattered defaults with an explicit, versioned **`RegionRules`** object (mechanics generation, learnsets, EXP and catch formulas, whiteout penalty, party/box limits, time model, level caps). Every engine formula reads rules, not constants. That makes "recreate RBY" and "any modern Pokémon game" the *same engine with different rules*. Inject **Clock** and seeded **Rng** into the engine for testability, fairness audits, and replays.

**MVP impact:** High · **Cost to change later:** Medium (hardcoded formulas spread quickly)

## Current shape
`Region.baseGeneration` (code default `10`), `charactersPerPlayer`, `graphicSettings`, `currencyType`. "Mechanics" is a placeholder menu.

## Decisions (Oct 2026): piecemeal rules, Gen 1 first

**Principle:** a region's rules are chosen **dimension by dimension**, each from any generation that implements it (e.g. Gen 1 catch formula + Gen 3 learnsets + Gen 6 type chart). **Only battle mechanics are holistic.** They're a single Showdown mechanics generation, because the simulator implements them as one coherent unit. Gimmicks (Mega Evolution, Z-Moves, Dynamax, Terastallization) are **separate toggles**, independent of the generation choice, and **not MVP**.

**MVP:** every dimension defaults to **Gen 1 (Classic)**, and Gen 1 is the only implemented option. The model supports all dimensions and generations from day one. Other generations' implementations are follow-up work, added per dimension without schema changes. Rules are part of the release, so changing them is a publish.

```ts
RegionRules {
  battle: {                                   // HOLISTIC: handled by the battle simulator
    mechanicsGen: GenId;                      // Showdown gen mod: damage/crit/turn order/status mechanics. MVP: 'gen1'
    gimmicks: { mega: false; zMoves: false; dynamax: false; tera: false };   // separate toggles; post-MVP
    defaultFormat: 'singles' | 'doubles'; setMode: boolean; clauses?: string[];
  };
  data: {                                     // PIECEMEAL: which generation's data the region uses
    speciesStats: GenId;                      // base stats (Gen 1 single Special stat; later-gen stat changes)
    types: GenId;                             // type chart + species/move typings (Gen 1: no Dark/Steel/Fairy, Ghost↛Psychic bug)
    moves: GenId;                             // move data (power/accuracy/type/PP as of that gen)
    learnsets: GenId;                         // level-up/TM/tutor sources
    catchRates: GenId;                        // species catch-rate data
  };
  formulas: {                                 // PIECEMEAL: engine-side calculations
    exp: GenId; expShare: 'item' | 'always-on' | 'off'; tradedBonus: boolean;   // MVP: gen1 (traded ×1.5, trainer-owned foe ×1.5), Exp. All item
    catch: GenId;                             // MVP: gen1 catch algorithm
    escape: GenId;                            // run-away odds
    whiteoutPenalty: GenId | 'none';          // Gen 1: lose half your money
    payout: GenId;                            // trainer prize money
  };
  graphics: {
    sprites: { gen: GenId; game?: string; palette?: 'normal' | 'gray' | 'color' };   // MVP: original Gen 1 sprites. Kanto Classic default: g1 'y', palette 'color'
    shinies: boolean;                         // Gen 1 has none
  };
  systems: {                                  // gameplay systems, mostly not generation-bound
    party: { size: 6; whenFull: 'toPc' | 'promptSwap' };   // 'promptSwap' (Q9)
    boxes: { count: number; size: number };   // Gen 1: 12 boxes × 20
    storage: { access: 'pcLocation' | 'anywhere' };
    trading: { access: 'pcLocation' | 'anywhere' };   // Gen 1: 'pcLocation' (Cable Club)
    tradeEvolutions?: …;                      // reserved, post-MVP: configurable alternative to trading (item / level); default: trade only   // Gen 1: 'pcLocation' (locations with services: ['pc']); modern presets: 'anywhere'
    bagCapacity?: number;                     // Gen 1: 20 item slots (optional authentic limit)
    nicknames: boolean; time: TimeRules;      // time unused in Gen 1 regions
    levelCap?: …;
    levelScaling?: …;                         // reserved, post-MVP: encounter levels relative to badges/party
    obedience?: { traded: { capsByMilestone: { key: string; caps: [number, ...number[]] } } };   // Gen 1: traded Pokémon obey up to 10 / 30 (Cascade) / 50 (Rainbow) / 70 (Marsh) / all (Earth)
  };
}
// GenId = 'gen1' | 'gen2' | … | 'gen9'. Each dimension has a registry of implemented options.
```

**How piecemeal data reaches the simulator.** Showdown's gen mods (`data/mods/gen1`, …) already hold per-generation species stats, move data, and type charts. The engine assembles the chosen mix per region release and injects it into that release's **isolated custom-data dex** (the same mechanism as server library content, see [14](14-battle-system-and-showdown.md)), running under `battle.mechanicsGen`.

**Compatibility is validated, not assumed.** Some mixes can't work with a given mechanics generation, e.g.:
- Split Special Attack/Defense data under Gen 1 mechanics (which only read one Special stat).
- Abilities or held items under Gen 1/2 mechanics.
- Fairy typings under a mechanics gen whose type handling predates it.

Each option declares its constraints (`requires`, `incompatibleWith`), and the validator blocks publishing an invalid mix with an explanation. The builder only offers compatible options.

**Changing rules on a live region (decided Oct 2026).** Rules live in the release, so a rule change reaches players only through a publish, like any other content. Characters move to the new release on their next action, and battles already in progress finish on the release they started on. The publish review ([16](16-authoring-validation-and-portability.md)) classifies each rule change:

| Kind | Examples | At publish |
|---|---|---|
| **Takes effect cleanly** | EXP/catch/escape/payout formulas, whiteout penalty, `storage.access` | Warning: "Changes rules for N characters mid-game." Never blocks. |
| **Breaks existing saves** | Fewer boxes than characters already use, a smaller `bagCapacity` than characters already carry, a smaller party size | **Error**, unless the change ships with a fix-up rule (e.g. "overflow Pokémon move to a new box", "excess items go to the PC"). Fix-up rules run in the release migration step ([01](01-content-vs-state-and-publishing.md)). |
| **Swaps the battle system** | `battle.mechanicsGen`, stat model (single Special → split), type chart | Warning plus the compatibility check above, because every existing Pokémon's stats and matchups behave differently afterward. |

There is no hard lock on rules after publish: real balance fixes must stay possible, and the review step stops accidents.

**Classic means intended behavior, not glitches (decided Oct 2026).** Rules reproduce how a generation was designed to play, not its exploitable bugs: no MissingNo., Mew glitch, item duplication, or level-1 EXP underflow. Engine-side formulas guard against them (clamping, validation). In-battle mechanics are whatever Showdown's gen mod implements.

**Gen 1 specifics the MVP must handle (no modern mechanics):**
- No abilities, held items, natures, genders, shinies, or breeding.
- DVs (0–15) and Stat Experience instead of IVs/EVs. Pokémon instances store values in Showdown's set shape, which encodes Gen 1/2 DVs and Stat Exp; the rules decide valid ranges.
- Original Gen 1 learnsets and move data (e.g. Bite is Normal-type).
- Gen 1 EXP, catch, escape, and payout formulas.
- **Original Gen 1 sprites.** DexEntry already stores `g1` sprite sets (`rb`, `rg`, `y`; normal/gray/color).
- **Formula reference:** every Gen 1 formula follows the [pret/pokered](https://github.com/pret/pokered) disassembly (e.g. `ItemUseBall` for catching, `TryRunningFromBattle` for escape), with unit tests against values worked from it.
- **Growth rates:** Gen 1 has four curves, computed from their formulas and floored to integers: Fast `4n³/5`, Medium Fast `n³`, Medium Slow `6n³/5 − 15n² + 100n − 140`, Slow `5n³/4`. Medium Slow is negative at level 1. The cartridge underflows there (the source of the level-1 → level-100 glitch); we clamp level 1 to 0 EXP instead.

**Presets** become saved combinations ("Classic Gen 1", later "RSE", "Modern"). The MVP ships only **Classic Gen 1**. Admins can still change any dimension once more generations are implemented.

### Candidate post-MVP options (not decided)
Opt-in rules that suit slower or narrated play, where battles are fewer and each one matters more ([22](22-adventure-log-and-narration.md#future-narrated-battle-mode-the-forum-model-with-the-engine-as-calculator)). Canon stays the default. Each would be added as a new option on an existing dimension, without schema changes.

| Option | Rule | Dimension |
|---|---|---|
| Stat investment preset | Every Pokémon gets fixed investment (e.g. maximum HP, minimum elsewhere) instead of rolled DVs/IVs and earned Stat Exp/EVs. Bulkier Pokémon make battles last longer. | `systems` (new) |
| Party-relative wild levels | Wild levels drawn from `maxPartyLevel − 7 … maxPartyLevel − 1`, then clamped to the slot's range | `systems.levelScaling` (reserved) |
| Payout level basis | Trainer payout uses the opposing party's highest level instead of its last Pokémon's level | `formulas.payout` variant |
| Non-participant EXP | Party members that didn't battle get half EXP, with no item needed | `formulas.expShare` (new value) |
| Shiny rate | A configurable rate (e.g. 1/500) instead of the generation's | `graphics.shinies` → rate |
| Catch modifiers from battle effects | Moves or effects multiply the catch rate while active (e.g. ×2 while the target is bound). Needs the catch resolver to see the target's active effects. | `formulas.catch` + custom moves ([12](12-content-catalog-species-moves-items.md)) |
| Percentage EXP | EXP measured as a percentage of a level per win instead of points, for narrated play | `formulas.exp` variant |

### Reference test vectors
Unit-test vectors for formula implementations. Gen 1 vectors are worked from pokered as each formula is implemented.

| Formula | Input | Expected |
|---|---|---|
| Growth, Medium Slow | L2 / L3 / L4 / L5 / L10 | 9 / 57 / 96 / 135 / 560 |
| Growth, Fast / Medium Fast / Slow | L10 | 800 / 1000 / 1250 |
| EXP, Gen 5 scaled: `floor((a·b·L / (5·s)) · ((2L+10)/(L+Lp+10))^2.5 + 1) · t` | `b`=64, `L`=5, `Lp`=5, wild, one participant | 65 |
| EXP, Gen 5 scaled | `b`=64, `L`=10, `Lp`=5, wild | 202 |
| EXP, Gen 5 scaled | same, trainer battle (`a`=1.5) | 303 |
| EXP, Gen 5 scaled | same, wild, traded (`t`=1.5) | 304 ⚠️ verify: the formula as written floors before `· t` (giving 303), and 304 needs the multiply first. Check the game's order before using this row. |
| Whiteout, Gen 4+: `base(badges) × highest party level`, capped at money; bases for 0–8 badges 8, 16, 24, 36, 48, 64, 80, 100, 120 | 2 badges, highest level 20, money ≥ 480 | lose 480 |
| Whiteout, Gen 4+ | 8 badges, highest level 50, money 3000 | lose 3000 (capped) |

## Time
- **Real-time in the server's timezone** is the most "Pokémon" option (Gen 2+ day/night, weekly NPCs) and the easiest to reason about for a community.
- **Accelerated** (e.g. a 4-hour day) makes time-of-day encounters accessible to players in one timezone who always play at night.
- The engine reads time only through an injected `Clock` (tests can fix time; the validator can simulate all day parts).

## Randomness
- All rolls (encounters, catch, run, loot, AI tie-breaks) go through an injected `Rng`, seeded per action (`hash(characterId, actionId)`) or per battle (Showdown seeds).
- This gives:
  - Reproducible bug reports ("replay action #1234").
  - Testable odds.
  - **Fairness transparency** (useful for community trust, e.g. shiny odds).
  - Prevention of re-roll exploits (canceling a menu and reopening doesn't re-roll if the seed is tied to the pending action).

## Options: hardcoded vs rules

| Option | Pros | Cons |
|---|---|---|
| A. Hardcode modern mechanics, add toggles ad hoc | Fast | Toggles sprawl. RBY authenticity is impossible later. |
| **B. Rules object + presets** (chosen) | One place for game feel. Presets make onboarding fast. Unlocks "any Pokémon game". | Each formula needs 2–3 implementations (small, well-documented functions). |

## MVP scope
- The piecemeal `RegionRules` model with Gen 1 implemented for every dimension and the "Classic Gen 1" preset, a Clock, an Rng, and a Mechanics menu to select a preset and edit the system toggles. Other generations and the "Modern" preset come after MVP.

## Open questions
- ~~Authentic Gen 1 or RBY content on modern mechanics?~~ **Decided (Q1):** authentic Gen 1, see Decisions above.
- ~~Lock rules after publish?~~ **Decided (Oct 2026):** no lock. Every rule change goes through a publish, and the publish review warns about mid-game changes and blocks save-breaking ones unless they include a fix-up rule. See [Changing rules on a live region](#decisions-oct-2026-piecemeal-rules-gen-1-first).
