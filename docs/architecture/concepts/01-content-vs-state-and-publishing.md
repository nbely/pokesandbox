# 01: Content vs State, and Publishing

> **TL;DR:** Separate *what the admin authored* (content) from *what the player has done* (state), and put an immutable **published release** between authoring and play. Characters play against a release version, so admins can keep building without breaking live saves.

**MVP impact:** High · **Cost to change later:** Very high (every runtime read path depends on it)

## Why it matters

A game engine has three kinds of data with very different lifecycles:

| Kind | Examples | Mutated by | Read by | Change rate |
|---|---|---|---|---|
| **Catalog** (global) | species, moves, items, abilities, learnsets | devs / seed / Showdown upgrades | everyone | rarely |
| **Content** (per region) | locations, edges, encounter tables, NPCs, trainers, scripts, shops, progression defs | admins | runtime (hot path) | bursts while authoring |
| **State** (per character) | location, party, bag, money, progress, flags, active script/battle | engine | engine, profile views | constantly |

Today catalog and content live in Mongo docs that are edited in place, and `Region.deployed` decides whether players can see them. That means:

- An admin renaming a milestone, deleting a location, or rewriting a trainer team **mutates the world under live players**, sometimes mid-battle or mid-script.
- `deployable` is stored, but it should be the *output of a validator* run at publish time.
- The runtime hot path (every button press) reads many small docs through a mutable cache (see [15](15-persistence-caching-concurrency.md)).

## Current shape

- `Region.deployed: boolean`, `Region.deployable: boolean` (stored, never computed).
- Admin commands write directly to `Region` / `Location`.
- No `Character` yet, so no damage has been done. This is the cheapest moment to decide.

## Options

### A. Live editing + "maintenance mode" (status quo, extended)
Admins must undeploy to edit. Deploy runs validation.
- ✅ Simplest. No extra storage.
- ❌ Every content tweak means downtime for all players in the region. Fixing one typo kicks everyone out.
- ❌ Deleting content still corrupts saves (e.g. a character standing in a deleted location).
- ❌ The runtime still reads mutable docs.

### B. Live editing with guarded deletes + per-entity soft-delete
Edits apply live. Deletes become soft (`archivedAt`), and the engine tolerates missing references.
- ✅ No downtime.
- ❌ Half-finished edits are visible to players (e.g. a new route that points nowhere).
- ❌ "Tolerate missing references" spreads defensive code through every engine path.

### C. Draft → Published Release (recommended)
Authoring collections act as the **draft**. **Publish** runs the validator, then *compiles* the region's content into an immutable, versioned **`RegionRelease`**. The engine only reads releases.

```
Admin edits ──► draft docs (Region, Location, Npc, Script, …)
                     │ publish
                     ▼
            Validator ──► errors? block : compile
                     ▼
     RegionRelease { regionId, version: 7, publishedAt, content: {...}, indexes: {...} }
                     ▼
 Engine: loads release v7 into memory (immutable, safe to share); characters record releaseVersion
```

- ✅ Admins edit freely. Players never see half-built content.
- ✅ The runtime reads one immutable object per region. It's trivially cacheable, needs no cloning, and lends itself to precomputed lookup tables (adjacency maps, encounter CDFs, script indexes).
- ✅ **Rollback** is "re-point to v6".
- ✅ Release diffs give you a free changelog ("v8: added Route 3, rebalanced Brock") to post to players.
- ✅ The same compiled bundle is the **import/export / template format** (see [16](16-authoring-validation-and-portability.md)).
- ❌ Needs a **save migration step** when a release removes something a character references. For example, if the current location is gone, move the character to the last heal point. This logic is small, explicit, and testable, unlike option B's defensive code everywhere.
- ❌ Storage: a Kanto-sized region compiles to a few MB. Mongo's 16 MB document limit means chunking by content type (`RegionReleaseChunk { releaseId, type, data }`) or GridFS. Both are easy.

### D. Event-sourced content
Every authoring edit is an event, and a release is a projection.
- ✅ Full audit trail and undo.
- ❌ Overkill. Option C plus an audit log gets 90% of the value.

## Recommendation

**Option C.** It doesn't need to be fancy in MVP:

1. **MVP:** `publish` = validate → serialize all region content → store `RegionRelease` (chunked) → set `Region.publishedVersion`. The engine reads via a `ContentProvider.getRelease(regionId)` interface backed by an in-memory LRU of immutable objects. `deployed` becomes "has a published version and is not paused". `deployable` becomes a computed validator result shown in the builder.
2. **MVP save migration:** a small set of rules run when a character loads with `releaseVersion < current`:
   - The current location is missing → move to respawn.
   - An active script is missing → abort it.
   - Unknown progression keys → keep but ignore.
3. **Later:** release notes/diff, rollback UI, scheduled publishes for server events, and "preview as player" for unpublished drafts. Preview is a killer authoring feature: an admin can play the draft with a throwaway character.

### Interaction with in-flight sessions
Active battles and scripts pin the release they started on and finish there. The next action loads the newest release. Keep N-1 and N in memory.

## MVP scope
- `RegionRelease` model, the publish command, the validator hook, the `ContentProvider` interface, and `Character.releaseVersion` plus 2–3 migration rules.
- Not in MVP: diff UI, rollback UI, preview mode.

## Open questions
- Should admins be able to **hot-fix** a typo in a published release without a full publish? (Recommendation: no. Publish is cheap; keep one path.)
- Should content changes be **announced to players** automatically (release notes to a channel)?
- Does "undeploy" mean "pause play" (characters frozen) or "hide region" (discovery off, play continues)?
