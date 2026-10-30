# 24: Shared State: Region & Server

> **TL;DR:** Most game state belongs to one journey ([23](23-players-characters-journeys-and-scopes.md)). **Shared state** belongs to everyone playing a region or a server: an NPC who only appears for the first 100 players, a community goal that opens a bridge, a story chapter an admin advances, a server-wide event. It lives in two documents, **`RegionState`** (per region) and **`ServerState`** (per server), read and written through the same condition and effect registries as everything else, with atomic, scoped **claims** for anything capped. All of it is post-MVP, and none of it changes the MVP model.

**MVP impact:** None (post-MVP; the documents are reserved) · **Cost to change later:** Low, as long as the reservations below hold

## Why it matters
A region that remembers what happens in it feels alive in a way a single-player save can't. Forum RPGs had this naturally: players saw each other's marks on the world. Shared state is also where the hard concurrency lives (many players racing for a capped reward), so it needs its own rules rather than being bolted onto journey flags.

## Design (post-MVP direction, decided Oct 2026)

### Two documents, two owners
| Scope | For | Examples | Keyed by |
|---|---|---|---|
| **Region** (`RegionState`, one doc per region) | The living region inside one game | First-X NPCs and gifts, shared goals, story chapters, trainer ghosts | Region content keys. Checked and migrated by that region's publishes (see Publishing below). |
| **Server** (`ServerState`, one doc per server) | What the community does across all its regions | Server events and giveaways spanning regions, server-wide goals ("10,000 catches across all our regions"), a server Hall of Fame, Arena records and leaderboards | Server-scoped keys, defined with server events or the server library. Region publishes never migrate it. |

A third level, one player's history across regions (sequels, carried Pokémon), isn't shared state. It's handled by characters and journeys ([23](23-players-characters-journeys-and-scopes.md#playing-more-than-one-region-post-mvp)).

### Reading and writing
- **Facts:** `region.counter`, `region.flag`, `region.stage`, `region.claimed`, and the same under `server.*`, in the `region` and `server` condition scopes ([05](05-requirements.md)). Encounter tables, party variants, dialogue, and gates read them like any other fact, so a region can gate on a server event ("during the Halloween event, Gengar appears in Lavender").
- **Effects:** `regionIncrement`, `regionClaim`, `serverIncrement`, `serverClaim` in the effect registry ([06](06-effects.md)). A region can write to server state, e.g. a catch counting toward a server-wide goal.
- **Players see live numbers** where it adds tension ("37 of 100 claimed", "4,212 / 5,000 caught").
- **Test journeys never count** toward shared state or claims ([01](01-content-vs-state-and-publishing.md)).
- **Contention:** hot counters (a popular route's catch count) use atomic `$inc` and can be batched or sharded if they ever bottleneck. That's not a concern at the expected scale.

## Examples

| Pattern | Examples |
|---|---|
| **Scarcity and firsts** | An NPC who only appears for the first 100 players. A gift Pokémon for the first X who find it. A one-of-a-kind roaming legendary: after the first catch, the cave is empty for everyone else. A Hall of Fame wall for the first N champions; the first full Pokédex honored in the professor's lab. A travelling merchant with limited stock for the whole region ([17](17-economy-shops-inventory.md)). |
| **NPCs that remember** | Dialogue that shifts the more times an NPC has been beaten region-wide, eventually with a stronger party variant. A gym leader who quotes their record ("Only 12 challengers have beaten me"), optionally with difficulty tuned by it. **Trainer ghosts:** NPC trainers built from real players' teams (like Gen 3 Secret Bases or the Battle Tower), a form of asynchronous PvP inside adventure play. They store a team snapshot (the `PokemonSnapshot` pattern from [22](22-adventure-log-and-narration.md)), so they don't depend on the original Pokémon still existing. |
| **Shared goals** | Community unlocks ("5,000 Pokémon caught on Cinnabar rebuilds the lab"). Donation drives (money or items to an NPC's fund; at the target a bridge opens). Collective bounties (enough Rocket grunts beaten region-wide opens the hideout raid). Population triggers ("once 100 Magikarp are fished out, something stirs" adds Gyarados to the table). |
| **A region that changes** | Story chapters an admin advances ("the Silph takeover begins Saturday"), changing NPCs, gates, and dialogue for everyone. Daily region rolls shared by every player ("today's swarm: Pikachu in Viridian Forest"), from a per-day region seed. Community votes deciding a story fork (which fossil the museum revives). |
| **Marks players leave** | Moderated signboards or guestbooks with short notes for other players at a location. Region records shown by an in-game NPC ("fastest to the 8th badge"). |
| **Server events** | Server-wide events and giveaways, a community boss with a shared HP pool, an event island every journey can visit (an event region, [23](23-players-characters-journeys-and-scopes.md#event-regions-and-visiting-post-mvp)). |

## Claims (decided Oct 2026)
A claim is needed only when there's a **shared cap or count** (first X players, limited region-wide stock, a one-of-a-kind legendary). Personal one-time rewards ("each playthrough can get the Eevee gift once") aren't claims: they're ordinary journey flags written by `once` triggers ([04](04-progression-and-flags.md)). Each claim declares who counts as one claimant, using the scopes from [23](23-players-characters-journeys-and-scopes.md#scopes-decided-oct-2026):

```ts
RegionClaim / ServerClaim { key; cap?: number; scope: 'user' | 'character' | 'journey' }   // default 'user'
```

| Scope | One claimant is | Use for | Risk |
|---|---|---|---|
| **`user`** (default) | The player, across all characters and journeys | Scarce rewards: first-X gifts, the one-of-a-kind legendary, limited stock | None; strictest and fairest for scarcity |
| **`character`** | Each persona | Event rewards each character may earn (Red and Gold each get the ribbon) | A player with several characters gets several claims; fine for generous or no caps |
| **`journey`** | Each playthrough | Uncapped "every journey counts" goals, or caps that are deliberately per playthrough | Restart abuse: archiving a journey and starting again gives a fresh claim (only the 24h restart cooldown slows it), so **the validator warns when `journey` scope is combined with a cap** |

- **Atomic:** a conditional increment that only succeeds while the count is below the cap, plus a claim record keyed by the scope, so double presses and races can't over-grant.
- **Claim records outlive journeys:** `user` and `character` claims stay after a journey is archived or restarted, which is what makes them restart-proof.
- **Contributions to shared goals** ("5,000 catches on Cinnabar") aren't claims: every action increments the counter. A per-player contribution limit, if wanted, is a claim-scoped cap on contributions.

## Records and leaderboards
Records ("fastest to the 8th badge") are measured per journey and shown by character name. Each record declares a dedupe scope (`user` by default, `character`, or `journey`), so one player's several journeys don't fill the board.

## Publishing (decided Oct 2026)
Shared state is **state, not content**. It survives publishes, is keyed by content keys, and admins can reset it. The publish review ([16](16-authoring-validation-and-portability.md), [01](01-content-vs-state-and-publishing.md#decisions-oct-2026)) checks each release against the region's current `RegionState`, and region-state migrations run **once, at publish, inside the publish transaction**, not lazily per journey, because the state is shared.

| Change in the release | Review result |
|---|---|
| Content that region state references is removed (a counter or claims for a deleted NPC or gift) | Warning. The data is kept, not deleted, and comes back if the key returns. Admins can purge it explicitly. |
| A "first X" cap is lowered below the claims already made | Warning: "73 already claimed, new limit 50: no new claims." Existing claims are never revoked. |
| A threshold that's already met (a community unlock) | Warning: "already satisfied, activates on publish." |
| The story stage the region is currently on is removed or renamed | **Error**, unless the publish includes a stage mapping (a region-state migration rule). |
| A counter's meaning changes (it now counts something different) | Warning, with an option to reset that counter at publish. |
| A reference to a server key that doesn't exist | Warning. Region publishes never migrate `ServerState`. |

## MVP scope
- Nothing to build. `RegionState` and `ServerState` are reserved names, and the `region` and `server` condition scopes are reserved ([05](05-requirements.md)), so later additions don't collide with MVP code.

## Open questions (post-MVP)
- Which admin tools come first: resetting counters, advancing story chapters, or scheduling server events?
- Moderation for player marks (signboards, guestbooks): reuse the narration moderator role ([22](22-adventure-log-and-narration.md)) or a separate one?
