# M0b: Content Foundations (backlog draft)

**Outcome:** the content-side primitives exist and are tested: conditions, gates, effects, content keys, the authoring layer, and draft → published region releases. The existing admin menus run on the authoring layer. This milestone blocks M3 (World Authoring) → M4 → M5 → M6, and runs in parallel with the battle track (M1 → M2).

**Out of scope here (deliberately):**
- `givePokemon` and `heal` effects (need `PokemonInstance`, M5).
- Battle-record retention (M1, when battle records exist).
- The full validator tiers (M3). Only the publish-time hook and structural checks land here.

Refs: [`mvp.md`](../roadmap/mvp.md) · concepts [01](../architecture/concepts/01-content-vs-state-and-publishing.md), [02](../architecture/concepts/02-identity-and-references.md), [04](../architecture/concepts/04-progression-and-flags.md), [05](../architecture/concepts/05-requirements.md), [06](../architecture/concepts/06-effects.md), [16](../architecture/concepts/16-authoring-validation-and-portability.md)

Depends on M0a: `libs/core` (M0A-09), boundaries (M0A-10), the engine skeleton (M0A-11/19), the test harness (M0A-14), and the local replica set (M0A-16).

---

## E-M0B-1 · Conditions & Gates
`Type: Epic` · `Priority: P0`

One gating primitive for everything: a condition tree of fact + operator + value predicates, evaluated with scopes, wrapped in a Gate envelope that the caller presents as hidden, locked, or attemptable.

### M0B-01 · Condition tree, fact registry, and evaluation context
`Type: Task` · `Parent: E-M0B-1` · `Priority: P0` · `Size: M` · `Labels: area:engine, domain:conditions-effects` · `Blocked by: M0A-09` · `agent-ready: no` · `Owner: senior`

**Summary:** In `libs/core`, a recursive zod schema for `Condition` (`all`/`any`/`not`/predicate), where a predicate is `{ fact: FactRef, op, value?, subject? }`. Includes a fact-resolver registry and an evaluation context with scopes.

**Acceptance criteria**
- `registerFact(kind, { schema, resolve(ctx, params), valueType, describe, validate, references })`.
- Shared operators: `eq`, `neq`, `gte`, `lte`, `in`, `has`, `exists`, type-checked against the fact's `valueType`.
- `EvaluationContext` scopes: `character`, `party`, `script`, `quest` (reserved), `world` (reserved), `target`/`subject`, `clock`. Unknown scopes and facts fail validation, not evaluation.
- `evaluate(condition, ctx) → boolean`. Pure, no I/O (facts read from a `CharacterView`).
- A single zod schema is used for both validation and Mongo storage (stored as validated `Mixed`).
- Unit tests for nesting, short-circuiting, and type errors.

**Refs:** [05 § stress test](../architecture/concepts/05-requirements.md#is-this-the-right-pattern-stress-test-against-scripts-quests-and-every-gate)

### M0B-02 · Explain, validate, and references
`Type: Task` · `Parent: E-M0B-1` · `Priority: P0` · `Size: M` · `Labels: area:engine, domain:conditions-effects` · `Blocked by: M0B-01` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- `explain(condition, ctx) → ExplanationNode`: why it failed, in player-facing text ("Requires the Boulder Badge"). Supports `playerVisible: false` facts (hidden details).
- `validate(condition, contentIndex) → Issue[]` checks keys and milestones exist and value types match.
- `references(condition) → Ref[]` lists every progression, flag, item, location, or species referenced (feeds "used by" and the validator).
- Snapshot tests for explanations of nested any/all/not.

### M0B-03 · Facts batch 1: progression, milestone, choice, flag
`Type: Task` · `Parent: E-M0B-1` · `Priority: P0` · `Size: M` · `Labels: area:engine, domain:progression` · `Blocked by: M0B-02, M0B-13` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- Facts: `progression.value`, `milestone.has`, `milestone.count`, `choice.value`, `flag`.
- Each implements resolve, describe, validate, and references, with tests against fixture region definitions.
- Explanations use the definitions' display names (e.g. milestone label, choice option label).

**Refs:** [05 § MVP scope](../architecture/concepts/05-requirements.md#mvp-scope), [04](../architecture/concepts/04-progression-and-flags.md)

### M0B-04 · Facts batch 2: bag, visited, party move, dex count
`Type: Task` · `Parent: E-M0B-1` · `Priority: P0` · `Size: M` · `Labels: area:engine, domain:conditions-effects` · `Blocked by: M0B-02` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- Facts: `bag.count` (item ID), `visited` (location key **or `$target`**), `party.knowsMove` (move ID), `dex.caughtCount`.
- `$target` is resolved from the context's `target` scope. Tested with a Fly-style "destination must be visited" condition.
- They read only from the `CharacterView` port (no Pokémon persistence needed yet; fakes in tests).

### M0B-05 · Facts batch 3: location progress
`Type: Task` · `Parent: E-M0B-1` · `Priority: P1` · `Size: M` · `Labels: area:engine, domain:world` · `Blocked by: M0B-02` · `agent-ready: yes` · `Owner: agent`

**Summary:** Define the `LocationProgress` state shape in `libs/core` (`{ cleared; lifetime: Counters; visit: Counters }`, where counters cover explores, wild battles, trainer battles, and distinct trainers defeated) and its facts. The engine updates it in M5.

**Acceptance criteria**
- Facts: `location.cleared`, `location.visit.<counter>`, `location.trainersDefeated`. Scoped to a location (the exited location for edges, the current location for NPC gates).
- Explanations read naturally ("Defeat 2 more trainers to continue", "2 more steps to get through Mt. Moon").

**Refs:** [10 § Traversal](../architecture/concepts/10-encounters.md#traversal-requirements-mvp-decided-oct-2026), [11 § Decisions](../architecture/concepts/11-npcs-trainers-and-battle-definitions.md#decisions-oct-2026-q4)

### M0B-06 · Gate envelope and `checkGate`
`Type: Task` · `Parent: E-M0B-1` · `Priority: P0` · `Size: M` · `Labels: area:engine, domain:conditions-effects` · `Blocked by: M0B-02, M0B-07` · `agent-ready: no` · `Owner: senior`

**Acceptance criteria**
- `Gate = { condition?, cost?: Effect[], presentation?: 'hidden' | 'locked' | 'attemptable', lockedText?, latch? }` schema in core.
- `checkGate(gate, ctx) → { allowed, presentation, explanation, cost }`. Each caller supplies a default presentation.
- `latch: true`: the first pass writes the reserved flag `gate:<ownerRef>:passed`, and later checks pass without re-evaluating (costs still apply).
- An attempted, blocked `attemptable` gate emits a `gateBlocked` event carrying the owner ref (consumed by triggers in M4).
- Cost preflight: an unaffordable cost blocks with an explanation and applies nothing.

**Refs:** [05 §4](../architecture/concepts/05-requirements.md)

---

## E-M0B-2 · Effects
`Type: Epic` · `Priority: P0`

Typed, declarative state changes, applied atomically and idempotently, which emit renderable events.

### M0B-07 · Effect registry and atomic executor
`Type: Task` · `Parent: E-M0B-2` · `Priority: P0` · `Size: L` · `Labels: area:engine, domain:conditions-effects` · `Blocked by: M0A-12` · `agent-ready: no` · `Owner: senior`

**Acceptance criteria**
- An `Effect` discriminated union plus `registerEffect(type, { schema, apply(draft, params, ctx), validate, references })`.
- `applyEffects(list, ctx)` works on an in-memory **character draft**: all-or-nothing, with post-validation (no negative counts or money, definition clamps). Commits through the repository port in one write (or a transaction when several documents are involved).
- Idempotent per `executionId` (recent-executions ring buffer on the character).
- Emits `GameEvent`s per effect (`itemsChanged`, `progressChanged`, …) for renderers.
- Tests: rollback on a failing effect, idempotent replay, event emission.

**Refs:** [06](../architecture/concepts/06-effects.md)

### M0B-08 · Effects batch 1: currency, item, flag, progression, milestone, choice
`Type: Task` · `Parent: E-M0B-2` · `Priority: P0` · `Size: M` · `Labels: area:engine, domain:progression` · `Blocked by: M0B-07, M0B-13` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- `currency` (delta), `item` (delta), `flag` (set/clear), `progression` (set/inc, respecting min/max and overflow `clamp`|`reject`), `milestone` (grant/revoke; `sequential` refuses out-of-order grants based on current holdings), `choice` (set/clear).
- Each has validate/references and tests, including the revoke and sequential cases.

**Refs:** [04 § Decisions](../architecture/concepts/04-progression-and-flags.md), [06](../architecture/concepts/06-effects.md)

### M0B-09 · Effects batch 2: setRespawn, random
`Type: Task` · `Parent: E-M0B-2` · `Priority: P1` · `Size: S` · `Labels: area:engine` · `Blocked by: M0B-07` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- `setRespawn` (location key; validated to exist).
- `random` (weighted table of effect lists, using the action's seeded `Rng`, so it's deterministic in tests).

---

## E-M0B-3 · Model Cleanup & Identity
`Type: Epic` · `Priority: P0`

Region-scoped content keys, one-directional references, and the progression/flag model the conditions and effects rely on.

### M0B-10 · Content keys
`Type: Task` · `Parent: E-M0B-3` · `Priority: P0` · `Size: S` · `Labels: area:shared-models` · `Blocked by: M0A-09` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- `ContentKey` zod type and generator (opaque ~10-char nanoid) in `libs/core`.
- `Location.key`, with a unique index `{ regionId, key }`. Backfill migration and seed update.
- Repository helpers require `regionId` for key lookups (no key-only lookup API).
- Connections reference `to: ContentKey` (migrated from `toLocationId`).

**Refs:** [02](../architecture/concepts/02-identity-and-references.md), [02 § Worked example](../architecture/concepts/02-identity-and-references.md#worked-example-copying-a-template-region-to-another-server)

### M0B-11 · Remove bidirectional references
`Type: Task` · `Parent: E-M0B-3` · `Priority: P0` · `Size: M` · `Labels: area:shared-models, area:bot` · `Blocked by: M0B-10` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- Remove `Region.locations`, `Region.characterList`, `Region.shops`, `Region.quests`, `Region.transportationTypes`, `Server.playerList`, `User.servers`. Add `Region.serverId` (indexed).
- Bot menus, DTOs, tRPC routers, seeds, and the ERD are updated to query by parent ID.
- Migration script for existing DBs. The webapp "my servers" list temporarily uses whatever works (the derived Discord-membership list is a later webapp issue).

### M0B-12 · Progression `choice` kind: builder
`Type: Feature` · `Parent: E-M0B-3` · `Priority: P0` · `Size: M` · `Labels: area:bot, domain:progression` · `Blocked by: M0B-13, M0B-18` · `agent-ready: yes` · `Owner: junior`

**Acceptance criteria**
- Discord progression builder: create/edit choice progressions and their options (through authoring commands).
- Display uses option labels.

**Refs:** [04](../architecture/concepts/04-progression-and-flags.md)

### M0B-13 · Progression schema: `choice` kind, overflow, sequential, revocation
`Type: Task` · `Parent: E-M0B-3` · `Priority: P1` · `Size: S` · `Labels: area:shared-models, domain:progression` · `Blocked by: —` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- `kind: 'choice'` with `options: { key; label; imageUrl? }[]` in the zod and Mongo schemas (the builder UI is M0B-12).
- `numeric.overflow: 'clamp' | 'reject'` (default `clamp`) in the schema plus a builder field.
- `sequential` semantics documented in code: checks current holdings, revocation doesn't cascade.
- Character progress state shape defined in core (`progress: Record<key, number | boolean | string | string[]>`, `flags: string[]`).

### M0B-14 · Flag conventions and the region flag index
`Type: Task` · `Parent: E-M0B-3` · `Priority: P1` · `Size: S` · `Labels: area:engine, domain:progression` · `Blocked by: M0B-02` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- Reserved prefixes constant (`trainer:`, `script:`, `pickup:`, `gift:`, `gate:`). Author flags can't use them (validation).
- A `collectFlags(regionContent)` helper builds the list of every flag read or written in a region (from conditions/effects `references()`), to feed the builder dropdown.

### M0B-15 · Delete integrity: inbound edges and "used by"
`Type: Task` · `Parent: E-M0B-3` · `Priority: P1` · `Size: M` · `Labels: area:authoring` · `Blocked by: M0B-02, M0B-16` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- Deleting a location removes inbound edges in the same transaction (or blocks with a "used by" list, depending on the command option).
- Deleting a progression, milestone, or choice option first returns "used by" references (via `references()`), and requires confirmation.
- Both Discord menus surface "used by" before deleting.

---

## E-M0B-4 · Authoring Layer & Releases
`Type: Epic` · `Priority: P0`

All admin edits flow through `libs/authoring`, and players only ever play immutable published releases.

### M0B-16 · Scaffold `libs/authoring`
`Type: Task` · `Parent: E-M0B-4` · `Priority: P0` · `Size: M` · `Labels: area:authoring` · `Blocked by: M0A-09, M0A-10` · `agent-ready: no` · `Owner: senior`

**Acceptance criteria**
- `createAuthoring(ports)` and `execute(actor, command) → { ok, changes, warnings, suggestions } | { ok: false, issues }`.
- Actor = Discord user + server. Role checks via a `PermissionsPort` (admin/mod role IDs). Never trusts client claims.
- Per-entity optimistic concurrency (`version` field). Conflicts return "changed by someone else, reload".
- `ContentChange[]` output, used for cache invalidation and a simple audit-log write.
- `suggestions` is always empty for now (reserved).
- Zod command schemas are exported for reuse in Discord modals and webapp forms.

**Refs:** [03 § Authoring](../architecture/concepts/03-engine-boundary-and-game-loop.md#authoring-the-same-pattern-for-region-building)

### M0B-17 · Migrate the Pokédex builder to authoring commands
`Type: Task` · `Parent: E-M0B-4` · `Priority: P1` · `Size: M` · `Labels: area:bot, area:authoring` · `Blocked by: M0B-16, M0A-19` · `agent-ready: yes` · `Owner: junior`

**Acceptance criteria**
- Pokédex menu actions (add slot, edit, swap, forms) call `authoring.execute`. No direct model writes in handlers.
- Behavior unchanged (manual test checklist in the PR).

### M0B-18 · Migrate the progression builder to authoring commands
`Type: Task` · `Parent: E-M0B-4` · `Priority: P1` · `Size: M` · `Labels: area:bot, area:authoring` · `Blocked by: M0B-16` · `agent-ready: yes` · `Owner: junior`

**Acceptance criteria**
- Progression and milestone create/edit/delete/reorder go through authoring commands.
- Behavior unchanged. Deletes show "used by" once M0B-15 lands.

### M0B-19 · Migrate the location builder to authoring commands
`Type: Task` · `Parent: E-M0B-4` · `Priority: P1` · `Size: M` · `Labels: area:bot, area:authoring` · `Blocked by: M0B-16, M0B-10` · `agent-ready: yes` · `Owner: junior`

**Acceptance criteria**
- Location create, rename, and delete go through authoring commands, using content keys.
- The "coming soon" buttons stay as they are (connections etc. are M3).

### M0B-20 · Deployment and discovery settings models
`Type: Task` · `Parent: E-M0B-4` · `Priority: P0` · `Size: M` · `Labels: area:shared-models` · `Blocked by: M0B-16` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- `Region.deployment: { status: 'draft' | 'live' | 'paused'; publishedVersion?; pausedAt?; pauseMessage? }` replaces `deployed`/`deployable`.
- `Region.discovery: { listed; description?; bannerImageUrl?; tags?; showStatus }`, independent of deployment.
- `Server.settings`: `releaseNotes { enabled; channelId?; mentionRoleId? }` and `play { mode: 'ephemeral' | 'thread' | 'channel'; channelId?; threadVisibility? }` (only `ephemeral` is implemented). Optional `Region.settings.playOverride`.
- The Region menu's Deploy toggle becomes Pause/Resume (publishing comes in M0B-21). Migration from the old booleans.

**Refs:** [01 § Decisions](../architecture/concepts/01-content-vs-state-and-publishing.md), [03 § Where play is shown](../architecture/concepts/03-engine-boundary-and-game-loop.md#where-adventure-play-is-shown-decided-oct-2026-q2)

### M0B-21 · Region releases: compile, publish, serve
`Type: Feature` · `Parent: E-M0B-4` · `Priority: P0` · `Size: L` · `Labels: area:authoring, area:engine` · `Blocked by: M0B-16, M0B-20, M0B-22` · `agent-ready: no` · `Owner: senior`

**Acceptance criteria**
- `region.publish` runs the validator hook (M0B-22). Blocking errors abort.
- Otherwise it compiles draft content into an immutable `RegionRelease` (gzip, chunked if large) with `version`, `publishedAt`, a catalog/library version pin, and a generated diff summary (for release notes).
- Sets `deployment.publishedVersion`. If `Server.settings.releaseNotes.enabled`, posts notes to the configured channel.
- `ContentProvider.getRelease(regionId, version?)` returns an immutable in-memory object (LRU). It keeps N and N-1 resident.
- Retention: keep the last 10 releases plus any referenced (characters, clones, templates). Older ones are pruned by a job.
- `compileRelease(regionId, { mode: 'preview' })` exists (unused yet) for future draft preview.
- `Character.releaseVersion` plus a migration-rule hook (rules implemented in M5).

**Refs:** [01](../architecture/concepts/01-content-vs-state-and-publishing.md), [21 § Retention](../architecture/concepts/21-hosting-and-environments.md)

### M0B-22 · Validator skeleton and Tier 1 structural checks
`Type: Task` · `Parent: E-M0B-4` · `Priority: P0` · `Size: M` · `Labels: area:authoring` · `Blocked by: M0B-02, M0B-10` · `agent-ready: yes` · `Owner: agent`

**Acceptance criteria**
- `validateRegion(draft) → { errors, warnings, info }` with typed `Issue { code, severity, subject, message, fixHint? }`.
- Tier 1 checks for current content: edge targets exist, a starting location is set, encounter species are in the regional dex, and conditions/effects pass `validate()`.
- Pluggable check registry, so M3 can add tiers.
- Exposed via an authoring query (for a later Region Health view).

**Refs:** [16](../architecture/concepts/16-authoring-validation-and-portability.md)
