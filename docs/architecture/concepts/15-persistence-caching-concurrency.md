# 15: Persistence, Caching & Concurrency

> **TL;DR:** Cache only **immutable** things (published releases, catalog). Never share mutable Mongoose documents across sessions. Player state writes go through the engine with a **per-character lock + optimistic concurrency**, and multi-document writes use **transactions** (run Mongo as a replica set, even locally). Add unique indexes now.

**MVP impact:** High · **Cost to change later:** Medium (but bugs found later are expensive: dupes and lost progress)

## Current shape
- `NodeCacheAdapter` with `useClones: false` caches **hydrated Mongoose documents** for Server/Region/Location/DexEntry (5-minute-ish TTLs).
- Handlers fetch a cached doc, mutate it, and `save()`, then invalidate the cache key.
- No indexes or unique constraints declared. Docker Mongo is a single node (no transactions).
- Cache interface is pluggable (good; Redis later).

## Risks

| Risk | Scenario |
|---|---|
| Shared mutable docs | Admin A's menu mutates `region.progressionDefinitions` (not saved yet). Admin B's menu saves the same object, which persists A's half-edit. Same for any two sessions on the same region. |
| Stale identity after TTL | Session holds doc X. TTL evicts it, a new fetch gives doc X'. Session saves X, and Mongoose may overwrite fields changed through X' (`save()` only sends modified paths, so mostly OK, but `__v` versioning only protects arrays). |
| Duplicate creation | Two concurrent first uses of `/server` both create a Server (no unique index on `serverId`). |
| Non-atomic multi-doc ops | Location delete: region updated, then location deleted. A crash in between leaves an orphan. |
| Player state (future) | Double-click "Buy" → two concurrent `money -= 200`. Read-modify-write without a guard means one is lost, or a dupe. |

## Recommendations

1. **Cache policy**
   - Cache: `RegionRelease` (immutable, see [01](01-content-vs-state-and-publishing.md)), catalog data, Discord metadata.
   - Don't cache: Character, PokemonInstance, draft content being edited. Fetch fresh, and keep docs short-lived per action.
   - If caching documents for reads, cache `lean()` plain objects (frozen in dev) rather than hydrated docs.
2. **Writes to player state**
   - Per-character lock in `engine.dispatch` as a **short DB lease** (`locks` collection with TTL index), because the bot and webapp both run the engine (see [03 § Process topology](03-engine-boundary-and-game-loop.md#process-topology-should-the-engine-be-its-own-container-proposed-oct-2026)). Redis later if lock traffic grows.
   - `optimisticConcurrency: true` on Character (Mongoose throws on a version mismatch, and the engine retries the action once).
   - Prefer atomic operators for hot counters (`$inc` money with a `$gte` guard) where they fit.
3. **Transactions**
   - Run Mongo as a single-node **replica set** in docker-compose (one flag plus init) so `session.withTransaction` works locally and in prod. Needed for battle results (Character + up to 6 PokemonInstances), trades, and publish.
4. **Indexes** (declare in schemas, verify in CI):
   - `Server.serverId` unique, `User.userId` unique.
   - `Location {regionId, ordinal}`, `Character {userId, regionId}` unique.
   - `PokemonInstance {ownerCharacterId, 'storage.kind'}`, `RegionRelease {regionId, version}` unique.
5. **Draft authoring writes**: atomic `$set` on paths (e.g. `progressionDefinitions.<key>`) instead of load-mutate-save of the whole Region. Concurrent admins then can't clobber each other's sections.
6. **Scale path** (design for it, don't build it): sharded bot processes need a Redis cache, Redis locks, and battles pinned to a process (or worker pool) by `battleId`. Keep those behind interfaces (`ICacheService` already is).

## MVP scope
- Replica set, indexes, cache policy change, per-character lock, OCC on Character, transactions for battle results/trades/publish.

## Open questions
- Hosting target for MVP: single VM/container with one bot process? (Fine for hundreds of concurrent players.)
- Backups / point-in-time restore expectations for player saves (Atlas vs self-hosted)?
