# 18: Region Rules, Time & Randomness

> **TL;DR:** Replace `baseGeneration` and scattered defaults with an explicit, versioned **`RegionRules`** object (mechanics generation, learnsets, EXP and catch formulas, whiteout penalty, party/box limits, time model, level caps). Every engine formula reads rules, not constants. That makes "recreate RBY" and "any modern Pokémon game" the *same engine with different rules*. Inject **Clock** and seeded **Rng** into the engine for testability, fairness audits, and replays.

**MVP impact:** High · **Cost to change later:** Medium (hardcoded formulas spread quickly)

## Current shape
`Region.baseGeneration` (code default `10`), `charactersPerPlayer`, `graphicSettings`, `currencyType`. "Mechanics" is a placeholder menu.

## Proposed shape
```ts
RegionRules {
  mechanicsGen: 1 | 2 | … | 9;             // Showdown format/mod (gen1 vs gen9); affects battle only
  learnsetGen: number;                      // which learnsets/TM compat to use
  dexScope?: 'regional' | 'national';       // what can exist/be traded in
  exp: { formula: 'gen1-4' | 'gen5-scaled' | 'gen6+' ; expShare: 'item' | 'always-on' | 'off'; tradedBonus: boolean };
  catch: { formula: 'gen1' | 'gen3-4' | 'gen5+' ; criticalCapture: boolean };
  party: { size: 6; whenFull: 'toPc' | 'promptSwap' };   // default 'promptSwap' (Q9): PC first, then a non-blocking swap offer
  boxes: { count: number; size: number };
  whiteout: { moneyLoss: 'half' | 'badgeFormula' | 'none'; respawn: 'lastHeal' | 'start' };
  levelCap?: { by: 'milestoneCount'; key: string; caps: number[] };   // Nuzlocke-style or modern-style obedience
  obedience?: { traded: boolean; byMilestone?: … };
  time: { mode: 'realTime' | 'accelerated' | 'fixed'; timezone: string; dayParts: { morning: [4, 10], … } };
  nicknames: boolean; bagCapacity?: number; runFromWild: 'formula' | 'always';
  battle: { defaultFormat: 'singles' | 'doubles'; setMode: boolean; clauses?: string[] };
}
```

Rules are part of the release, so changing them is a publish. *(Superseded by the piecemeal design in "Decisions" below; the shape above is kept for history.)*

## Decisions (Oct 2026): piecemeal rules, Gen 1 first

**Principle:** a region's rules are chosen **dimension by dimension**, each from any generation that implements it (e.g. Gen 1 catch formula + Gen 3 learnsets + Gen 6 type chart). **Only battle mechanics are holistic.** They're a single Showdown mechanics generation, because the simulator implements them as one coherent unit. Gimmicks (Mega Evolution, Z-Moves, Dynamax, Terastallization) are **separate toggles**, independent of the generation choice, and **not MVP**.

**MVP:** every dimension defaults to **Gen 1 (Classic)**, and Gen 1 is the only implemented option. The model supports all dimensions and generations from day one. Other generations' implementations are follow-up work, added per dimension without schema changes.

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
    exp: GenId; expShare: 'item' | 'always-on' | 'off'; tradedBonus: boolean;   // MVP: gen1, Exp. All item
    catch: GenId;                             // MVP: gen1 catch algorithm
    escape: GenId;                            // run-away odds
    whiteoutPenalty: GenId | 'none';          // Gen 1: lose half your money
    payout: GenId;                            // trainer prize money
  };
  graphics: {
    sprites: { gen: GenId; game?: string; palette?: 'normal' | 'gray' | 'color' };   // MVP: original Gen 1 sprites (e.g. g1 'rb' or 'y')
    shinies: boolean;                         // Gen 1 has none
  };
  systems: {                                  // gameplay systems, mostly not generation-bound
    party: { size: 6; whenFull: 'toPc' | 'promptSwap' };   // 'promptSwap' (Q9)
    boxes: { count: number; size: number };   // Gen 1: 12 boxes × 20
    bagCapacity?: number;                     // Gen 1: 20 item slots (optional authentic limit)
    nicknames: boolean; time: TimeRules;      // time unused in Gen 1 regions
    levelCap?: …; obedience?: …;
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

**Gen 1 specifics the MVP must handle (no modern mechanics):**
- No abilities, held items, natures, genders, shinies, or breeding.
- DVs (0–15) and Stat Experience instead of IVs/EVs. Pokémon instances store values in Showdown's set shape, which encodes Gen 1/2 DVs and Stat Exp; the rules decide valid ranges.
- Original Gen 1 learnsets and move data (e.g. Bite is Normal-type).
- Gen 1 EXP, catch, escape, and payout formulas.
- **Original Gen 1 sprites.** DexEntry already stores `g1` sprite sets (`rb`, `rg`, `y`; normal/gray/color).

**Presets** become saved combinations ("Classic Gen 1", later "RSE", "Modern"). The MVP ships only **Classic Gen 1**. Admins can still change any dimension once more generations are implemented.

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
| **B. Rules object + presets** (recommended) | One place for game feel. Presets make onboarding fast. Unlocks "any Pokémon game". | Each formula needs 2–3 implementations (small, well-documented functions). |

## MVP scope
- RegionRules with the "Modern" and "Classic Gen 1" presets (implement the formulas those need), a Clock, an Rng, and a Mechanics menu to select a preset and edit a few key toggles.

## Open questions
- For "Recreate Red/Blue/Yellow": **authentic Gen 1 mechanics** (no abilities, no held items, Special stat, 1/256 misses) or **RBY content on modern mechanics** (closer to Let's Go / FRLG)? This decides what MVP must implement.
- Should rules be **lockable after publish** (to avoid mid-game formula changes) or freely editable?
