# 06: Effects

> **TL;DR:** An **Effect** is a typed, declarative state change (a discriminated union, registry-backed like predicates). Effects run in an **all-or-nothing transaction** against a journey, emit `GameEvent`s for rendering, and are **idempotent per firing**. Costs are just effects with a precondition. Dialogue, choices, and battles are *not* effects; they're script steps (see [07](07-scripts-triggers-and-events.md)).

**MVP impact:** High · **Cost to change later:** Medium

## Current shape
Not built. The original plan and your roadmap agree on the primitive: grant/take items, currency deltas, Pokémon gifts, progression set/increment, flag set. You'll attach these to triggers, NPC talk/defeat, and later transport hops and quests.

## Design

```ts
type Effect =
  | { type: 'currency';     delta: number }                                   // negative = cost
  | { type: 'item';         item: ItemId; delta: number }
  | { type: 'givePokemon';  spec: PokemonSpec; to?: 'party' | 'auto' }        // species, level, moves?, shiny?, nature?, ivs?, heldItem?, nickname?, ot?
  | { type: 'progression';  key: string; op: 'set' | 'inc'; value: number }
  | { type: 'milestone';    key: string; milestone: string; grant: boolean }
  | { type: 'choice';       key: string; option: string | null }
  | { type: 'flag';         flag: string; set: boolean }
  | { type: 'heal';         scope: 'party' }                                  // restores HP, status, and PP
  | { type: 'setRespawn';   location: LocationRef }
  | { type: 'teleport';     location: LocationRef | 'respawn' }               // 'respawn' = Escape Rope / Teleport / Dig
  | { type: 'random';       table: { weight: number; effects: Effect[] }[] }  // loot tables, mystery gifts
  | …;
```

### Execution semantics (the parts that bite later if undecided)
1. **Atomic.** All effects in a list apply or none do. The engine applies them to an in-memory draft of the journey, validates the result (no negative item counts, no negative money (never below 0), party overflow → PC), then commits with one write (or one transaction if Pokémon instances are touched).
2. **Preflight for costs.** A list containing `currency: -500` fails cleanly with an explanation ("You need ₽500") instead of half-applying. "Entry cost" = condition + effects, so no separate cost model is needed.
3. **Idempotent.** Every firing carries an `executionId` (e.g. `scriptRun:<id>:step:<n>`) recorded on the journey's recent-executions ring buffer. Retries after a crash or a double-click don't double-grant.
4. **Observable.** Each effect yields events (`itemsChanged`, `pokemonGranted`…). The renderer produces "You received a Potion!" automatically. Admins never write that text.
5. **Clamped by definitions.** Numeric progression respects `min/max/overflow`. Sequential milestones refuse out-of-order grants.

## Options

| Option | Pros | Cons |
|---|---|---|
| A. Bespoke reward fields per model (`trainer.rewardMoney`, `npc.giftItem`, …) | Simple forms | N copies of reward logic. Every new attach point needs new fields. |
| **B. Effect list primitive + registry** (chosen) | One executor. Attach anywhere. Auto-rendered. Testable. | Generic builder UI (mitigated with templates: "Give item", "Give money", "Give Pokémon"). |
| C. Effects as script steps only (no standalone lists) | Even more uniform | Overkill for "trainer pays money on defeat". Lists remain useful as the atomic payload *inside* a script step. |

## What effects may write (decided Oct 2026)
Effects write only to the **current journey**, **region state**, **server state**, and claim records ([24](24-shared-state-region-and-server.md)). They never write to the character or user. Character- and user-level achievements ("completed Kanto", a profile badge case across regions) are **derived** from journeys, so region content never leaves references inside a persona, and archiving or deleting a region can't break one.

## Where effects attach (MVP)
- Script `effects` step (covers NPC talk, gifts, gym rewards, triggers).
- Trainer `onDefeat` default rewards (money formula + optional effects).
- Location `onEnter` (usually better as a trigger script, but simple costs/flags are handy).
- Transport hop (fare).
- Item use (overworld item behaviors are effects: Potion = heal 20 HP, Repel = set status; see [12](12-content-catalog-species-moves-items.md)).

## Pick-1 gifts are not an effect
"Choose 1 of 3 starters" needs UI (show the options, wait for the player) and then branching. That's a script `choice` step whose branches contain effects (`givePokemon` + `choice` progression set). This keeps effects synchronous and UI-free. See [07](07-scripts-triggers-and-events.md).

## Open questions
- ~~Negative money?~~ **Decided (Oct 2026):** no. Money never drops below 0. A `currency` effect that would push it negative fails preflight with an explanation ("You need ₽500"). Penalties that take a share (Gen 1 whiteout halves money) can't go negative by construction.
- ~~Full party on receiving a Pokémon?~~ **Decided (Q9): prompt to swap in MVP.** The `givePokemon` effect stays atomic and non-interactive: it places the Pokémon in the PC when the party is full and emits `pokemonGranted { to: 'pc', canSwapIn: true }`. The renderer then offers a **non-blocking "Swap into party?"** follow-up action (pick a party member to send to the PC). Catches use the same flow. If the player ignores it, the Pokémon simply stays in the PC.
- ~~Conditions inside effects?~~ **Decided (Oct 2026):** no. Branching belongs in scripts. Effects stay plain lists, so they remain atomic, idempotent, and easy to render ("You received 3 Potions").
