# 04: Progression & Flags

> **TL;DR:** The current progression design is solid. Add the roadmap's **`choice`** kind. Add a separate, **engine-managed flag space** for bookkeeping (trainer defeated, event fired, item picked up) so admins don't have to hand-create a boolean progression for every one-off event.

**MVP impact:** Medium · **Cost to change later:** Low–medium

## Current shape (built)

```ts
progressionDefinitions: Map<key, {
  kind: 'numeric' | 'milestone' | 'boolean';
  name; description?; visibility: 'public' | 'discoverable' | 'hidden';
  min?; max?;                                // numeric
  sequential?; milestones?: { key; label; description?; imageUrl?; ordinal? }[]  // milestone
}>
```

Character state is planned as `progress: Map<key, number | boolean | string[]>`.

## Gaps

| Gap | Game-design example | Fix |
|---|---|---|
| No **choice / enum** kind | Starter choice, faction choice, "sided with Team Aqua", rival personality | Add `kind: 'choice'` with `options: { key, label, imageUrl? }[]`. Value is one option key (or null). The roadmap already plans this. |
| No **engine bookkeeping** space | "Trainer Bug Catcher #3 defeated", "Route 2 hidden Potion collected", "Snorlax event done", "Forced rival battle at Route 22 fired" | Most games have *thousands* of these. Admins shouldn't have to define a progression for each. They should be implicit. |
| No **counters for stats** | Pokédex seen/caught, battles won, steps | Derived from state (dex entries) or engine stats, not progressions. |
| **Sequential** semantics undefined at runtime | Must badges be earned in order? | Make it explicit: `sequential` means the engine *refuses* to grant milestone N+1 before N, and the validator warns about out-of-order grants. |
| `numeric` has no **overflow policy** | Effects push past `max` | Clamp (default) vs reject. Make it a field. |
| Deleting a definition orphans references | Requirement on `badges` after `badges` is deleted | Validator plus a "used by" lookup before delete (see [16](16-authoring-validation-and-portability.md)). |

## Flags vs progressions: options

| Option | Description | Pros | Cons |
|---|---|---|---|
| A. Everything is a progression | Admin defines a hidden boolean per event | One concept | Authoring burden explodes. Definitions bloat. |
| B. **Two layers** (recommended) | **Progressions** = curated, displayable, author-defined meters. **Flags** = an open keyspace written by scripts and engine bookkeeping, never displayed. Character stores `flags: string[]` (set semantics). | Matches real Pokémon engines (pokeemerald has ~2,300 event flags and a handful of "progression" vars). Zero authoring cost for one-offs. | Two concepts to explain. |
| C. Flags only, progressions as views | Everything is a flag/var. "Badges" is a UI grouping over flags. | Most uniform | Loses typed metadata (min/max, ordinal, visibility). Harder authoring. |

With option B, engine-managed flags use reserved prefixes:
- `trainer:<key>:defeated`
- `script:<key>:done`
- `pickup:<key>:taken`
- `gift:<key>:claimed`

Admin-authored flags are free-form (`rocket_hideout_cleared`). Conditions can test either (`{ flag: 'trainer:brock:defeated' }`). The builder can offer flags from a dropdown of "flags written anywhere in this region" (computed by the validator), which gives discoverability without definitions.

## Recommendation
- Add `choice` now (small change).
- Adopt option B. `Character.flags: string[]` (or a `Map<string, true>`) plus `Character.progress: Map<key, value>`.
- All mutations go through **effects** (`setProgression`, `incrementProgression`, `grantMilestone`, `setChoice`, `setFlag`, `clearFlag`). Nothing else writes progress.
- Add `overflow: 'clamp' | 'reject'` to numeric.
- Later kinds slot in without schema surgery: `tiered` (named bands over numeric), `set` (open collection), `timer` (cooldowns, "can rematch after 24h").

## Display
- `visibility` already handles the profile.
- Add an optional `display` hint: `badgeCase` (grid of milestone images), `meter`, `list`, `hidden`. The profile renderer and the webapp can then make badges look like badges without special-casing the key "badges".

## Open questions
- Should flags be **region-scoped only**, or do you foresee **server-scoped / global** flags (e.g. server events, the community boss defeated)? Recommendation: character flags are region-scoped, and add a separate `WorldState` doc per region for server-wide state when you build server events.
- Can a player ever **lose** a milestone? (It affects whether `sequential` checks "has N-1" or "has ever had N-1".)
