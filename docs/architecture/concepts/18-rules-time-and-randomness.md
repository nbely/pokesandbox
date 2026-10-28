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
  party: { size: 6; whenFull: 'toPc' | 'promptSwap' };
  boxes: { count: number; size: number };
  whiteout: { moneyLoss: 'half' | 'badgeFormula' | 'none'; respawn: 'lastHeal' | 'start' };
  levelCap?: { by: 'milestoneCount'; key: string; caps: number[] };   // Nuzlocke-style or modern-style obedience
  obedience?: { traded: boolean; byMilestone?: … };
  time: { mode: 'realTime' | 'accelerated' | 'fixed'; timezone: string; dayParts: { morning: [4, 10], … } };
  nicknames: boolean; bagCapacity?: number; runFromWild: 'formula' | 'always';
  battle: { defaultFormat: 'singles' | 'doubles'; setMode: boolean; clauses?: string[] };
}
```

Ship **presets**: "Classic Gen 1", "Gen 3 (RSE)", "Modern (Gen 9)". Admins pick a preset and then tweak. Rules are part of the release, so changing them is a publish.

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
