# 06: Effects

> **TL;DR:** An **Effect** is a typed, declarative state change (a discriminated union, registry-backed like predicates). Effects run in an **all-or-nothing transaction** against a character, emit `GameEvent`s for rendering, and are **idempotent per firing**. Costs are just effects with a precondition. Dialogue, choices, and battles are *not* effects; they're script steps (see [07](07-scripts-triggers-and-events.md)).

**MVP impact:** High · **Cost to change later:** Medium

## Current shape
Not built. ChatGPT and your roadmap agree on the primitive: grant/take items, currency deltas, Pokémon gifts, progression set/increment, flag set. You'll attach these to triggers, NPC talk/defeat, and later transport hops and quests.

## Proposed shape

```ts
type Effect =
  | { type: 'currency';     delta: number }                                   // negative = cost
  | { type: 'item';         item: ItemId; delta: number }
  | { type: 'givePokemon';  spec: PokemonSpec; to?: 'party' | 'auto' }        // species, level, moves?, shiny?, nature?, ivs?, heldItem?, nickname?, ot?
  | { type: 'progression';  key: string; op: 'set' | 'inc'; value: number }
  | { type: 'milestone';    key: string; milestone: string; grant: boolean }
  | { type: 'choice';       key: string; option: string | null }
  | { type: 'flag';         flag: string; set: boolean }
  | { type: 'heal';         scope: 'party' }
  | { type: 'setRespawn';   location: LocationRef }
  | { type: 'teleport';     location: LocationRef }                           // roadmap: "expanded"
  | { type: 'random';       table: { weight: number; effects: Effect[] }[] }  // loot tables, mystery gifts
  | …;
```

### Execution semantics (the parts that bite later if undecided)
1. **Atomic.** All effects in a list apply or none do. The engine applies them to an in-memory draft of the character, validates the result (no negative item counts, no negative money unless allowed, party overflow → PC), then commits with one write (or one transaction if Pokémon instances are touched).
2. **Preflight for costs.** A list containing `currency: -500` fails cleanly with an explanation ("You need ₽500") instead of half-applying. "Entry cost" = condition + effects, so no separate cost model is needed.
3. **Idempotent.** Every firing carries an `executionId` (e.g. `scriptRun:<id>:step:<n>`) recorded on the character's recent-executions ring buffer. Retries after a crash or a double-click don't double-grant.
4. **Observable.** Each effect yields events (`itemsChanged`, `pokemonGranted`…). The renderer produces "You received a Potion!" automatically. Admins never write that text.
5. **Clamped by definitions.** Numeric progression respects `min/max/overflow`. Sequential milestones refuse out-of-order grants.

## Options

| Option | Pros | Cons |
|---|---|---|
| A. Bespoke reward fields per model (`trainer.rewardMoney`, `npc.giftItem`, …) | Simple forms | N copies of reward logic. Every new attach point needs new fields. |
| **B. Effect list primitive + registry** (recommended) | One executor. Attach anywhere. Auto-rendered. Testable. | Generic builder UI (mitigated with templates: "Give item", "Give money", "Give Pokémon"). |
| C. Effects as script steps only (no standalone lists) | Even more uniform | Overkill for "trainer pays money on defeat". Lists remain useful as the atomic payload *inside* a script step. |

## Where effects attach (MVP)
- Script `effects` step (covers NPC talk, gifts, gym rewards, triggers).
- Trainer `onDefeat` default rewards (money formula + optional effects).
- Location `onEnter` (usually better as a trigger script, but simple costs/flags are handy).
- Transport hop (fare).
- Item use (overworld item behaviors are effects: Potion = heal 20 HP, Repel = set status; see [12](12-content-catalog-species-moves-items.md)).

## Pick-1 gifts are not an effect
"Choose 1 of 3 starters" needs UI (show the options, wait for the player) and then branching. That's a script `choice` step whose branches contain effects (`givePokemon` + `choice` progression set). This keeps effects synchronous and UI-free. See [07](07-scripts-triggers-and-events.md).

## Open questions
- Can money go **negative** (debt mechanics)? Default no.
- When the party is full and you receive a Pokémon: always to the PC (Gen 1 behavior) or prompt to swap (modern)? Make it a region rule.
- Do effects need **conditions inline** (`{ if: Condition, then: Effect[] }`)? Recommendation: no. Branching belongs in scripts. Keep effects dumb.
