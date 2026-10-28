# 05: Requirements → Conditions

> **TL;DR:** Replace the bucketed, AND-only `requirementSchema` with a composable **Condition** tree (`all` / `any` / `not` plus typed predicates) backed by a **predicate registry**. Every predicate knows how to validate, evaluate, and **explain itself** ("Requires the Boulder Badge"). One evaluator then serves locations, edges, shops, encounters, NPC visibility, party variants, script branches, and transport hubs.

**MVP impact:** Very high · **Cost to change later:** High (requirements get embedded in every content type)

## Current shape (built)

```ts
requirement = {
  progressions?: Record<progressionKey, { min?, max? } | { equals: boolean | string | number | string[] }>,
  items?: { itemId: ObjectId, minQuantity }[],
  capabilities?: ({ type: 'pokemon_move', move } | { type: 'party_size', min })[],
}
// semantics: every listed bucket must pass (implicit AND)
```

## Gaps

| Gap | Example the current shape can't express |
|---|---|
| No OR | "Has Badge 3 **or** has the Card Key" |
| No NOT | "Rival **not** yet defeated here" (needed for one-time encounters and party variants) |
| `equals` is ambiguous | For a milestone, does `equals: ['boulder']` mean exactly that set or contains it? Count semantics vs specific-milestone semantics share `min/max`. |
| Missing predicate types | time of day, visited location (`is_in_visited`), flag, choice, currency, party species/type/level, character in location, random chance, day of week (Gen 2 weekly NPCs), weather |
| No contextual targets | Fly's "destination must be visited" needs to refer to *the candidate destination* |
| No explanations | The UI can't tell the player *why* a path is locked |
| Two schema definitions | Zod and a Mongoose `Mixed` map drift apart |

## Proposed shape

```ts
type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | Predicate;

type Predicate =
  | { type: 'progression'; key: string; op: 'gte' | 'lte' | 'eq'; value: number }          // numeric, or milestone COUNT
  | { type: 'milestone';   key: string; milestone: string }                               // has a specific milestone
  | { type: 'choice';      key: string; in: string[] }
  | { type: 'flag';        flag: string; is: boolean }
  | { type: 'item';        item: ItemId; min?: number }
  | { type: 'currency';    min: number }
  | { type: 'party';       has: PartyMatcher; min?: number }      // move 'cut' | species | type | level ≥
  | { type: 'visited';     location: LocationRef }                // LocationRef = ContentKey | '$target'
  | { type: 'time';        of: TimeOfDay[] } | { type: 'weekday'; in: Weekday[] }
  | { type: 'chance';      percent: number }                      // evaluated with seeded RNG
  | …;  // registry-extensible
```

Each predicate type is registered once:

```ts
registerPredicate('milestone', {
  schema,                              // zod (the single source; Mongo stores it as validated Mixed)
  evaluate(p, ctx) → boolean,          // ctx = { character, release, target?, rng, clock }
  explain(p, ctx) → string,            // "Requires the Boulder Badge"
  validate(p, release) → Issue[],      // key exists? milestone exists?
  references(p) → Ref[],               // for "used by" lookups and dependency graphs
  playerVisible: true,                 // hide 'chance'/'flag' details from players
});
```

### Why a registry
- New mechanics (weather, factions, follower Pokémon) are **additive**: one file, no schema migrations.
- `references()` gives the authoring tool "where is this progression used?" and lets the validator build the **progression dependency graph** used for soft-lock detection.
- `explain()` yields good UX: "🔒 Route 2 → Viridian Forest: needs a Pokémon that knows Cut" instead of a silent missing button.

## Options

| Option | Pros | Cons |
|---|---|---|
| A. Keep buckets, add more buckets | Familiar, simple builder | Still AND-only. Every new need is a schema change. |
| B. Buckets + top-level `anyOf: Requirement[]` | Gives OR at one level | NOT and nesting are still missing. Grows awkward fast. |
| **C. Condition tree + registry** (recommended) | Fully expressive, extensible, explainable | Builder UX needs care. Nested trees are hard to edit in Discord modals. |
| D. Embedded expression language (`"badges >= 2 && !flag('x')"`) | Compact, power-user friendly | Parsing, error messages, injection surface. A poor fit for non-coders. Possible later as an *authoring syntax* that compiles to C. |

## Authoring UX (so option C stays friendly)
- The builder **defaults to a flat "all of these" list**, which covers about 90% of cases and looks just like today's buckets.
- "Advanced" adds any/not groups (one nesting level in Discord). Deep trees are a webapp-builder or JSON-import feature.
- **Templates:** "Requires badge…", "Requires HM move…", "Only once", "Only before flag…", "Requires item…".

## Contextual targets (resolves the Fly debate)
You were right in the ChatGPT discussion: `is_in_visited` is just another predicate over player state. The general form is a predicate that refers to `$target`. Transportation evaluates each hub's `destinationCondition` with `target = hub.location`, and Fly's template is `{ type: 'visited', location: '$target' }`. A ferry template simply omits it. No hardcoded Fly logic anywhere.

## MVP scope
- Predicate types: `progression`, `milestone`, `choice`, `flag`, `item`, `currency`, `party` (move/species), `visited`, `time`, plus `all`/`any`/`not`.
- Evaluator, explainer, validator, and builder (flat list + one nesting level).

## Open questions
- Should failing conditions on a **connection** hide the edge, or show it as locked with an explanation? (Recommendation: per-condition `hiddenWhenLocked` flag. Default is to show it locked, which teases content like real games do.)
- Should HM field moves require the move only, or also a badge (Gen 1–4 style)? With conditions that's a *content* decision (`all: [party has cut, milestone cascade]`), not an engine one. Confirm you want it to stay content-defined.
