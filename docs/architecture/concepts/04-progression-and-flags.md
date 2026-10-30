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
| B. **Two layers** (chosen) | **Progressions** = curated, displayable, author-defined meters. **Flags** = an open keyspace written by scripts and engine bookkeeping, never displayed. Character stores `flags: string[]` (set semantics). | Matches real Pokémon engines (pokeemerald has ~2,300 event flags and a handful of "progression" vars). Zero authoring cost for one-offs. | Two concepts to explain. |
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

## Decisions (Oct 2026, Q21)
Option B (two layers) adopted: curated **progressions** (displayable) + open **flags** (engine-reserved prefixes `trainer:`, `script:`, `pickup:`, `gift:`, `gate:`, plus author flags created inline). The builder offers a dropdown of every flag used in the region, and a "Promote to progression" action for flags that turn out to matter to players.

## Living world: region-wide state (post-MVP direction, Oct 2026)

A region that remembers what happens in it. Like server events, but scoped to one region and driven by what players collectively do. It builds on the reserved per-region **`WorldState`** document (see Open questions below), so it's additive: nothing in the MVP needs to change.

**Examples**

| Pattern | Examples |
|---|---|
| **Scarcity and firsts** | An NPC who only appears for the first 100 players. A gift Pokémon for the first X who find it. A one-of-a-kind roaming legendary: after the first catch, the cave is empty for everyone else. A Hall of Fame wall for the first N champions; the first full Pokédex honored in the professor's lab. A travelling merchant with limited stock for the whole region (the reserved shop `limit: { per: 'server' }`, [17](17-economy-shops-inventory.md)). |
| **NPCs that remember** | Dialogue that shifts the more times an NPC has been beaten region-wide, eventually with a stronger party variant. A gym leader who quotes their record ("Only 12 challengers have beaten me"), optionally with difficulty tuned by it. **Trainer ghosts:** NPC trainers built from real players' teams (like Gen 3 Secret Bases or the Battle Tower), a form of asynchronous PvP inside adventure play. |
| **Shared goals** | Community unlocks ("5,000 Pokémon caught on Cinnabar rebuilds the lab"). Donation drives (money or items to an NPC's fund; at the target a bridge opens). Collective bounties (enough Rocket grunts beaten region-wide opens the hideout raid). Population triggers ("once 100 Magikarp are fished out, something stirs" adds Gyarados to the table). |
| **A world that changes** | Story chapters an admin advances ("the Silph takeover begins Saturday"), changing NPCs, gates, and dialogue for everyone. Daily world rolls shared by every player ("today's swarm: Pikachu in Viridian Forest"), from a per-day region seed. Community votes deciding a story fork (which fossil the museum revives). |
| **Marks players leave** | Moderated signboards or guestbooks with short notes for other players at a location. Region records shown by an in-world NPC ("fastest to the 8th badge"). |

**Design notes**
- **Facts and effects:** world facts (`world.counter`, `world.flag`, `world.stage`, `world.claimed`) join the condition registry ([05](05-requirements.md)), and world effects (`worldIncrement`, `worldClaim`) join the effect registry ([06](06-effects.md)). Encounter tables, party variants, dialogue, and gates read them like any other fact.
- **"First X" claims are atomic and per character:** a conditional increment that only succeeds while the count is below X, plus a per-character claim record, so double presses and races can't over-grant (the same idempotency rules as effects).
- **World state is state, not content.** It survives publishes, is keyed by content keys, and can be reset by admins. Test characters never count toward it ([01](01-content-vs-state-and-publishing.md)).
- **Players see live numbers** where it adds tension ("37 of 100 claimed", "4,212 / 5,000 caught").
- **Trainer ghosts** store a team snapshot, the same `PokemonSnapshot` pattern as the adventure log ([22](22-adventure-log-and-narration.md)), so they don't depend on the original Pokémon still existing.
- **Contention:** hot world counters (a popular route's catch count) should use atomic `$inc` and can be batched or sharded if they ever bottleneck. That's not a concern at MVP scale.

## Open questions
- ~~Region-scoped flags?~~ **Decided:** character flags are per character, per region. Server-wide state lives in a separate `WorldState` doc per region (arrives with server events).
- ~~Can a player lose a milestone?~~ **Decided: yes**, as numeric progressions can decrease. Milestones are revoked with the `milestone` effect (`grant: false`).
  - Conditions evaluate **current** state, so revoking genuinely removes access.
  - Gates that should stay open use `latch: true` ([05 §4](05-requirements.md)).
  - `sequential` checks the **current** holdings ("has N-1 now"). Revoking an earlier milestone does not cascade-revoke later ones.
- ~~Staff flag tools?~~ **Decided: not MVP** (view/edit a character's flags). The MVP runs on the owner's server, and maintainers fix records directly.
