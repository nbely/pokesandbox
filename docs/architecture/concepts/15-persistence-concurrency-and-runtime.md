# 15: Persistence, Concurrency & Runtime Topology

> **TL;DR:** Cache only **immutable** things (published releases, catalog). Never share mutable Mongoose documents across sessions. Player state writes go through the engine with a **per-journey lock + optimistic concurrency**, and multi-document writes use **transactions** (run Mongo as a replica set, even locally). Add unique indexes now. Stateful runtime (live battles, timers) runs in one game host per server partition, with **battle leases** so deploy overlaps and sharding never run a battle twice.

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
   - Don't cache: Journey, PokemonInstance, draft content being edited. Fetch fresh, and keep docs short-lived per action.
   - If caching documents for reads, cache `lean()` plain objects (frozen in dev) rather than hydrated docs.
2. **Writes to player state**
   - Per-journey lock in `engine.dispatch` as a **short DB lease** (`locks` collection with TTL index), because the bot and webapp both run the engine (see Process topology below). Redis later if lock traffic grows.
   - `optimisticConcurrency: true` on Journey (Mongoose throws on a version mismatch). The engine retries once **only for actions that don't depend on the rendered view**; view-dependent actions carry the journey `rev` and are re-rendered instead, so a duplicate press is never applied twice. Revisions, preconditions, and the one-active-session rule are in [03 § Per-journey serialization](03-engine-boundary-and-game-loop.md#per-journey-serialization-revisions-preconditions-and-sessions-decided-oct-2026).
   - Prefer atomic operators for hot counters (`$inc` money with a `$gte` guard) where they fit.
3. **Transactions**
   - Run Mongo as a single-node **replica set** in docker-compose (one flag plus init) so `session.withTransaction` works locally and in prod. Needed for battle results (Journey + up to 6 PokemonInstances), trades, and publish.
4. **Indexes** (declare in schemas, verify in CI):
   - `Server.serverId` unique, `User.userId` unique.
   - `Location {regionId, ordinal}`, `Journey {userId, regionId}` unique among active journeys.
   - `PokemonInstance {ownerJourneyId, 'storage.kind'}`, `RegionRelease {regionId, version}` unique.
5. **Draft authoring writes**: atomic `$set` on paths (e.g. `progressionDefinitions.<key>`) instead of load-mutate-save of the whole Region. Concurrent admins then can't clobber each other's sections.
6. **Scale path** (design for it, don't build it): multi-process sharding needs a shared cache (Redis) and battles owned by the process that owns their server (see Sharding below). Keep caches and locks behind interfaces (`ICacheService` already is).

## Process topology: should the engine be its own container? (decided Oct 2026: option C)

**Concern:** if game actions also run from the webapp (e.g. box reordering), they shouldn't depend on the Discord bot process being up.

| Option | How | For | Against |
|---|---|---|---|
| **A. Embedded library** | Bot and webapp both import `libs/engine` and call `dispatch` in-process against the same DB | Webapp actions keep working when the bot is down. No extra service, API, or cost. | Locks must work across processes (DB lease). Stateful parts (live battles, timers) can only live in one process. |
| **B. Separate engine service** | Engine runs in its own container. Bot and webapp call it over an API (e.g. tRPC/HTTP), and it pushes events back (pub/sub) | One authority for locks, battles, timers. Bot crashes don't touch game state. Scales independently. | Another container (cost) and an API contract, auth between services, and event push to the bot. **The engine becomes a single point of failure for both clients**, which is the same blast radius moved, not removed. |
| **C. Hybrid (chosen)** | A now, designed for B: `libs/engine` is embedded in both clients for **stateless, short actions** (box reorder, party order, profile settings). **Stateful runtime** (BattleService, turn timers, scheduled jobs) runs in exactly one **game host** process, which is the bot process for MVP. | The webapp is independent of the bot for QoL actions. There's no extra container yet. Extraction later is mechanical, because the boundary is already "action in, events out". | Two deployment shapes to keep in mind. The webapp must refuse actions that touch Pokémon in an active battle (the journey's `mode` already says so). |

**Notes on option C:**
- **Failure isolation you actually get:** the webapp (box management, profiles, authoring) keeps working if the bot crashes. Discord play is down while the bot is down under *any* option, since Discord *is* that client. Live battles are persisted and recovered on restart, so a bot crash costs a few seconds, not game state.
- **Correctness across processes** comes from the DB: lease-based per-journey locks, optimistic concurrency on Journey/Pokémon documents, and transactions for multi-document changes. Nothing relies on in-memory state shared between processes.
- **CPU isolation inside the game host:** AI turn search and battle simulation run in **worker threads**, so heavy AI can't stall the bot's Discord event loop.
- **When to extract the engine/game host into its own container (option B):**
  - The bot shards into multiple processes (battles need one authority).
  - A second client needs real-time gameplay (e.g. a webapp battle UI).
  - Engine CPU or memory starts hurting bot responsiveness despite workers.

  The extraction is: wrap `dispatch` and BattleService in an API, move the battle host into the new container, and have the bot subscribe to events. No game logic changes.

### Sharding, deploys, and who owns live state (decided Oct 2026)
**When Discord forces sharding:** one gateway connection (shard) serves at most **2,500 servers**; beyond that Discord refuses to connect without sharding (`/gateway/bot` recommends a count, roughly one shard per 1,000 servers). Each server's events, interactions included, go to exactly one shard: `(guildId >> 22) % shardCount`. Sharding doesn't require multiple processes: discord.js **internal sharding** (`shards: 'auto'`) runs several shards in one process, which typically holds well past 2,500 servers. Expected timeline: no sharding through the MVP and early public use → internal sharding at 2,500 servers (nothing else changes) → multiple processes only if one process runs out of CPU or memory.

**The nearer risk is deploys.** Managed hosts often start the new instance before stopping the old one. For a Discord bot that's two live processes for a moment, both receiving events and both recovering battles on boot, which would duplicate turns, timers, and rewards. One design covers deploy overlap and multi-process sharding alike:
1. **Every live record carries its server:** battles, turn timers, challenges, and trades have a `guildId`. Everything stateful already lives within one server (Arena, trades, journeys, even event regions).
2. **Ownership follows the shard:** a single `ownsGuild(guildId)` function decides whether this process is responsible for a server. One process returns `true` for everything; multiple processes apply Discord's shard formula. A battle stays with the process that receives its server's button presses, so nothing needs routing between processes.
3. **Battle leases:** a process runs a battle only while it holds that battle's lease (`ownerInstance`, renewed by heartbeat), the same DB lease mechanism as journey locks. On boot it recovers only battles of servers it owns whose lease it can take. During a deploy overlap the old process keeps its leases until it stops, and the new one takes over as they expire, so each battle runs in exactly one place.
4. **Resharding is a restart:** a new shard count changes the server-to-shard mapping, and every battle (seed + input log, injections included) and timer (a stored deadline) is recovered by its new owner, the same path as after any restart ([14](14-battle-system-and-showdown.md)).
5. **Deploy setting:** the bot's service is configured for **no overlap** (stop the old instance, then start the new) where the host allows it, with one replica until multi-process sharding is real. The leases are the safety net if an overlap happens anyway.
6. **The webapp never runs battles or timers**, so none of this affects it.

## MVP scope
- Replica set, indexes, cache policy change, per-journey lock, OCC on Journey, transactions for battle results/trades/publish.
- Live-record `guildId`, `ownsGuild`, and battle leases (built with BattleService in M1); a no-overlap deploy setting for the bot (M2).

## Open questions
- ~~Hosting target and backups?~~ **Decided (Q30):** one always-on bot process on a managed host, Atlas Free plus nightly `mongodump` for MVP, then Atlas Flex or DigitalOcean Managed MongoDB (daily backups) before opening to other servers. See [21](21-hosting-and-environments.md).
