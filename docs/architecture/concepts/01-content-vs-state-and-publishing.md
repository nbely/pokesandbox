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

## Decisions (Oct 2026)

Option C was adopted. The owner's refinements:

**1. Release notes: opt-in, configurable destination.** Models are needed for MVP. The UI is low priority.
```ts
Server.settings.releaseNotes: {
  enabled: boolean;               // default false (opt-in)
  channelId?: string;             // any channel, e.g. a private staff channel. Owners can refine there and repost publicly.
  mentionRoleId?: string;         // optional ping
}
RegionRelease.notes: {
  generated: ReleaseDiffSummary;  // auto: added/changed/removed content since the previous version
  authored?: string;              // optional admin-written notes entered at publish time
}
```
On publish, if enabled, the bot posts `authored ?? rendered(generated)` to `channelId`. With no channel set, nothing is posted, but the notes are still stored on the release (the webapp and future release history can show them).

**2. Deployment and discovery are separate axes.** Deploy state controls *play*. Discovery controls *visibility*. An undeployed, in-progress region can be discoverable (sneak peeks, recruiting testers), and a deployed region can be unlisted.
```ts
Region.deployment: {
  status: 'draft' | 'live' | 'paused';   // draft = never published; live = playable; paused = undeployed (characters frozen)
  publishedVersion?: number;             // release served while live
  pausedAt?: Date; pauseMessage?: string;
}
Region.discovery: {
  listed: boolean;                       // independent of deployment.status
  description?; bannerImageUrl?; tags?: string[];
  showStatus: boolean;                   // show "In development" / "Live" / "Paused" badge on the discovery page
}
```
- **Paused (undeployed)** means the engine rejects all player actions for the region with the pause message. Characters are frozen exactly where they are (mode, battle, script cursor), and resuming continues from there. Arena PvP is server-scoped and **unaffected** by pausing a region (see [14](14-battle-system-and-showdown.md#arena-formats-decided-oct-2026-server-scoped-not-region-scoped)). Only Phase 3 in-game PvP with adventure parties is region-bound, and those battles are frozen like any other battle.
- `Server.discovery` stays as the *server-level* listing. `Region.discovery` is the per-region listing within it. The discovery page shows a region only if both are enabled.
- This replaces the old `deployed` / `deployable` booleans. "Deployable" is the computed validator result.

**3. Draft preview is later, designed for now.** To keep it cheap later:
- Releases can be compiled *from the current draft without being published*: `compileRelease(regionId, { mode: 'preview' })` produces an ephemeral release that is never set as `publishedVersion`.
- `Character.isTest: boolean` plus `Character.releaseRef: { kind: 'published', version } | { kind: 'preview', id }`.
- Test characters are excluded from discovery stats, leaderboards, trading, and PvP.

## Open questions
- Should admins be able to **hot-fix** a typo in a published release without a full publish? (Recommendation: no. Publish is cheap; keep one path.)
- ~~Announce releases to players?~~ Decided: opt-in, configurable channel (see above).
- ~~Undeploy semantics?~~ Decided: pause play. Discovery is a separate axis (see above).
