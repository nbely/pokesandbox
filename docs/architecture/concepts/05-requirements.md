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
| Missing predicate types | time of day, visited location (`is_in_visited`), flag, choice, currency, party species/type/level, current location, random chance, day of week (Gen 2 weekly NPCs), weather |
| No contextual targets | Fly's "destination must be visited" needs to refer to *the candidate destination* |
| No explanations | The UI can't tell the player *why* a path is locked |
| Two schema definitions | Zod and a Mongoose `Mixed` map drift apart |

## Design

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
  evaluate(p, ctx) → boolean,          // ctx = { journey, release, target?, rng, clock }
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
| **C. Condition tree + registry** (chosen) | Fully expressive, extensible, explainable | Builder UX needs care. Nested trees are hard to edit in Discord modals. |
| D. Embedded expression language (`"badges >= 2 && !flag('x')"`) | Compact, power-user friendly | Parsing, error messages, injection surface. A poor fit for non-coders. Possible later as an *authoring syntax* that compiles to C. |

## Authoring UX (so option C stays friendly)
- The builder **defaults to a flat "all of these" list**, which covers about 90% of cases and looks just like today's buckets.
- "Advanced" adds any/not groups (one nesting level in Discord). Deep trees are a webapp-builder or JSON-import feature.
- **Templates:** "Requires badge…", "Requires HM move…", "Only once", "Only before flag…", "Requires item…".

## Contextual targets (resolves the Fly debate)
You were right in the original design discussion: `is_in_visited` is just another predicate over player state. The general form is a predicate that refers to `$target`. Transportation evaluates each hub's `destinationCondition` with `target = hub.location`, and Fly's template is `{ type: 'visited', location: '$target' }`. A ferry template simply omits it. No hardcoded Fly logic anywhere.

## Is this the right pattern? (stress test against scripts, quests and every gate)

A condition tree is a well-proven pattern. It's the *Specification* pattern, and it's what Bethesda's Creation Kit uses for every dialogue line, quest stage, and perk (`function(params) <op> value`, with AND/OR, run on a subject/target), and what RPG Maker event pages use. It holds up across scripts and quests **with six refinements**. Without them it starts to strain.

### 1. Split *facts* from *comparisons*
Instead of one bespoke predicate per feature, a predicate is **a fact read + an operator + a value**:

```ts
Predicate = { fact: FactRef; op: 'eq' | 'neq' | 'gte' | 'lte' | 'in' | 'has' | 'exists'; value?: unknown; subject?: Subject }
FactRef   = { kind: 'progression'; key } | { kind: 'milestoneCount'; key } | { kind: 'flag'; flag }
          | { kind: 'bag'; item } | { kind: 'money' } | { kind: 'party.knowsMove'; move } | { kind: 'party.hasSpecies'; species }
          | { kind: 'visited'; location } | { kind: 'time.partOfDay' } | { kind: 'var'; scope: Scope; key } | …
```

The registry then holds **fact resolvers** (how to read X, its value type, how to describe it, what it references), and operators are shared. A new mechanic is one new fact kind, and every operator, the explainer, and the builder work with it automatically. The builder still shows friendly templates ("Requires badge…"); they just generate fact + op + value. *This replaces the per-predicate list in "Design" above as the internal structure. The authoring surface is unchanged.*

### 2. Scoped facts make conditions work inside scripts and quests
Conditions read through an **evaluation context** with scopes:

| Scope | Lives on | Used by |
|---|---|---|
| `journey` | the current Journey (progress, flags, bag, money, visited) | everything |
| `character` | the persona's **other** journeys, read-only (reserved, post-MVP) | sequel gates and callbacks: "must have completed Kanto Classic" for `Region.entry`, "you sided with Team X in Kanto" dialogue ([13](13-characters-and-pokemon-instances.md#playing-more-than-one-region-post-mvp)) |
| `user` | account-level facts, read-only (reserved, post-MVP) | event eligibility ("any journey on this server has beaten a Champion") |
| `party` / `pokemon` | Pokémon instances | HM gates, evolution conditions, NPC reactions ("show me a Pikachu") |
| `script` | the running script's locals | branching inside a script (`if local.choice == 'fight'`) |
| `quest` | a quest instance's variables | quest stage gates and completion checks |
| `region` | the region's shared `RegionState` (post-MVP) | first-X claims, shared goals, story chapters ([04](04-progression-and-flags.md#living-region-shared-state-post-mvp-direction-oct-2026)) |
| `server` | the server's shared `ServerState` (post-MVP) | server events across regions, community boss ("boss defeated") |
| `target` / `subject` | whatever the caller is evaluating against | Fly destinations (`$target`), "the Pokémon being used on" for items |
| `clock` | injected Clock | time of day, weekday |

So scripts and quests don't need their own condition system. They add **scopes**, not new condition kinds. Quest v2 adds a `quest` scope; co-op adds a `participant` subject.

### 3. Conditions check *current state*. Objectives accumulate *history*.
Some quest goals look like requirements but aren't: "defeat 10 wild Pokémon", "catch 3 Bug types", "deliver 5 Oran Berries". These aren't true or false about the current state; they count **events over time**. Model them as **objective trackers**: event listeners (`pokemonDefeated`, `pokemonCaught`, `itemsChanged`) that update quest-scope variables. Then a plain condition checks the variable (`var quest.bugsCaught gte 3`). Conditions stay pure and stateless, and the counting lives where events are. Without this split, people try to cram counters into conditions, and that's where rule systems rot.

### 4. A standard "gate" envelope for anything that blocks an action (decided Oct 2026)
Most attach points need more than a boolean. *How* a failed check is presented is a **caller/UI concern, not part of the condition**. The same condition can be invisible in one place, shown locked in another, and attemptable in a third.

```ts
Gate = {
  condition?: Condition;
  cost?: Effect[];                                   // consumed when the gated action happens (fares, entry fees, tickets)
  presentation?: 'hidden' | 'locked' | 'attemptable';
  lockedText?: string;                               // overrides the auto-explanation ("The guard won't let you pass.")
  latch?: boolean;                                   // default false. true = "once cleared, always cleared" (see below)
}
```

**Live by default, latch optionally (decided Oct 2026).** Gates are evaluated against **current** state. If a badge is revoked or a numeric progression drops, access is genuinely lost again. That's the simple, predictable default. For "once cleared, always cleared", set `latch: true`: the first time the gate passes, the engine writes the reserved flag `gate:<ownerRef>:passed`, and from then on the gate passes without re-checking its condition (costs still apply if the gate has them). It's one check in `checkGate` plus a flag, with no milestone history to track. It's the same pattern `location.cleared` uses for traversal.

| Presentation | Player sees | On attempt | Typical use |
|---|---|---|---|
| `hidden` (**default**) | nothing | n/a | background checks, secret paths, NPC visibility, encounter tables |
| `locked` | the option, disabled, with the explanation / `lockedText` | n/a | shop items, Fly destinations, badge-gated doors you want to tease |
| `attemptable` | the option, enabled | blocked: shows the rationale **and emits a `gateBlocked` trigger event**, so a script can react (a guard's dialogue, a forced battle, starting a quest) | "The road is blocked by a sleeping Snorlax", "You need a Card Key", tutorial nudges |

- **Locked options in Discord menus** stay in the list with a 🔒 marker, and the explanation is always reachable: shown inline (option description or text under the list), or the option stays pressable and replies with it. A disabled Discord button can't be pressed, so on its own it gives the player no way to learn why.
- Each attach point declares its **default** presentation (e.g. shop entries default to `locked`, edges and NPCs to `hidden`), and authors can override per gate.
- Reacting to a blocked attempt is **not** part of the condition or the gate. It's an ordinary trigger (`{ event: 'gateBlocked', gate: <owner ref> }`, see [07](07-scripts-triggers-and-events.md)). The builder can offer "on blocked, run script…" as sugar that creates the trigger.
- Locations, edges, shops and shop entries, transport hubs, NPC interactions, and quest starts all take a `Gate`. There's one builder component and one engine function: `checkGate` → `{ allowed, presentation, explanation, cost }`.

### 5. Same conditions, different *usage policies*
The condition is the same everywhere. What differs is how the caller uses the result, so make the policy explicit instead of re-implementing it per feature:

| Policy | Used by |
|---|---|
| **Gate**: allow/deny + explain | locations, edges, shops, transport, quest start |
| **Filter**: keep the items that pass | shop entries, choice options, NPC visibility, encounter tables |
| **First match** (ordered) | trainer party variants, encounter-table priority |
| **Most specific match** (most predicates satisfied) | dialogue variants, an NPC's "what do I say now". Valve's dynamic-dialogue technique: authors add specific lines without reordering lists. |
| **Branch** | script `if` |
| **Guard** | triggers |

### 6. Know what each condition depends on, so it can react
`references()` tells the engine which facts a condition reads. That enables:
- **Reactive triggers** ("when badges reach 8, start the League invitation script"): re-evaluate only conditions that depend on a fact an effect just changed. No polling, no "check every trigger on every action".
- **Validator dependency graph** for soft-lock detection (see [16](16-authoring-validation-and-portability.md)).
- **"Used by"** in the builder.

### What conditions must *not* do
- No side effects. Costs are effects carried by the Gate.
- No hidden randomness. `chance` (if kept) uses the action's seeded Rng, so re-rendering a menu doesn't re-roll. For most uses, a script `random` branch is clearer.
- No unbounded work (e.g. "any Pokémon in all boxes with…"). Fact resolvers declare their cost, and the validator flags expensive facts in hot paths.

### Alternatives considered

| Alternative | Verdict |
|---|---|
| Off-the-shelf rules engine (`json-rules-engine`, Drools-style forward chaining) | Similar data shape, but you lose typed facts, explain/validate/references, and zod-first schemas. The core is ~300–500 lines. Build it. |
| Embedded scripting for conditions (Lua/JS expressions) | Power-user only, sandboxing burden. Possible later as text syntax that compiles to this tree. |
| Per-feature bespoke gates (status quo) | The thing we're replacing. |
| Pure fact/rule "query" system (Valve-style), for everything | Excellent for dialogue selection, clumsy for hard gates. Adopted *as one usage policy* (most specific match), not as the whole system. |

**Verdict:** conditions remain the one gating primitive for everything. Facts + scopes + the Gate envelope + usage policies make it fit scripts, quests (with objective trackers alongside), and every other access gate without special cases.

## MVP scope
- `all` / `any` / `not` with at least one level of grouping in the Discord builder. RBY needs both: *knows Cut **and** has the Cascade Badge*, and the Saffron gate guards accept *Fresh Water **or** Soda Pop **or** Lemonade*.
- **MVP facts (decided Oct 2026, scoped to a Red/Blue/Yellow Kanto):**

  | Fact | RBY use |
  |---|---|
  | `milestone.has` | Badge needed to use each HM outside battle, Route 23 badge guards |
  | `milestone.count` | Viridian Gym locked until 7 badges |
  | `choice.value` | Rival team keyed off the starter |
  | `flag` | Oak's Parcel, trainers defeated, Snorlax, Silph Co., S.S. Anne departure, gifts claimed |
  | `bag.count` | S.S. Ticket, Bicycle, Silph Scope, Poké Flute, Card Key, Lift Key, Secret Key, gate drinks |
  | `visited` (incl. `$target`) | Fly destinations |
  | `party.knowsMove` | Cut / Surf / Strength / Flash obstacles, using Fly |
  | `party.hasSpecies` | In-game trades ("Do you have an Abra?"), branching dialogue before an `npcTrade` step |
  | `dex.caughtCount` | Oak's aides (HM05 Flash at 10, Itemfinder at 30, Exp. All at 50) |
  | `progression.value` | Not required by RBY, but admins will gate on numeric and boolean progressions they define |
  | `location.cleared` / `location.visit.<counter>` | Traversal requirements: unavoidable route trainers, cave step costs (see [10](10-encounters.md#traversal-requirements-mvp-decided-oct-2026)) |
  | `location.trainersDefeated` | Gym leader appears/unlocks after N gym trainers are beaten (see [11](11-npcs-trainers-and-battle-definitions.md#decisions-oct-2026-q4)) |

- **Deferred:**
  - `money`: affordability is already handled by the cost check before effects apply.
  - `time.partOfDay`: RBY has no day/night, so encounter tables use `any`.
  - `currentLocation`: NPCs are already placed per location.
  - `party.size`: covered by the starter choice/flag.
  - Script `var`: MVP branching uses choice labels.
  - `dex.caught`; plus everything already listed as post-MVP (quest vars, region/server state, single-Pokémon facts, weekday, weather, `party.maxLevel`).
- **Not a fact: the blackout/respawn point.** It's journey *state* (`Journey.location.respawn`), written by the `setRespawn` effect and automatically by using a `heal` service. The engine reads it directly on whiteout, per `RegionRules.whiteout`. It only becomes a fact if some condition ever needs to ask "where is my respawn?", which no known content does.
- Evaluator, explainer, validator, and builder (flat list + one nesting level).

## Open questions
- ~~Hide or show locked?~~ Decided: caller-owned `presentation` on the Gate (`hidden` default, `locked`, `attemptable` with a `gateBlocked` trigger event). See §4.
- ~~HM gating rules?~~ Decided: creator-defined content, never engine logic. **Post-MVP builder shortcuts:** common gate templates ("Requires HM move", "Requires badge + HM"), plus contextual suggestions. For example, adding HM02 Fly to the region's TM/HM list prompts "Enable traditional Fly travel?" and creates the Fly transport network with its conditions. Design hook for now: authoring command results include `suggestions: Suggestion[]` (see [03 § Authoring](03-engine-boundary-and-game-loop.md#authoring-the-same-pattern-for-region-building)) that any client can offer; MVP returns none.
- ~~Power-user text syntax?~~ **Decided:** a later, very low priority enhancement (e.g. `badges.count >= 2 and not flag(rival_r22)` compiling into the tree).
