# 20: Database & Realtime Platform (MongoDB vs SpacetimeDB vs alternatives)

> **TL;DR:** Stay on **MongoDB** for MVP, configured properly (replica set, transactions, indexes, change streams). Keep all persistence behind the engine's repository interfaces ([03](03-engine-boundary-and-game-loop.md)), and add **Redis** when you shard the bot. SpacetimeDB is impressive, but it solves a problem PokeSandbox doesn't have (thousands of realtime game clients needing sub-100 ms state sync). Adopting it would mean moving the whole game engine into a vendor-specific module runtime. **PostgreSQL** is the only serious alternative. It's slightly better for Phase 3 social/economy features but not worth a migration now. Revisit at the Phase 3 checkpoint below.

**MVP impact:** Medium · **Cost to change later:** Medium if persistence stays behind repositories, very high if it doesn't

> **Decision (Oct 2026):** Stay on MongoDB. Live PvP stays in Discord for the foreseeable future. The owner puts moving play fully to the webapp, which is the only scenario that would favor SpacetimeDB, at roughly 1–2%. SpacetimeDB is shelved, with no spike planned. The Phase 3 Postgres checkpoint still stands. Revisit only if a webapp-first play surface becomes a real plan.

## First: what kind of "concurrent multiplayer" is PokeSandbox?

| Property | PokeSandbox | Typical realtime game (SpacetimeDB's target) |
|---|---|---|
| Clients | **1–N bot processes + a Next.js app** (Discord users never talk to the DB) | Thousands of game clients holding open connections |
| Tick rate | None. Event-driven, human-paced (button press every few seconds; battle turns every 10–90 s) | 10–60 Hz simulation |
| Latency floor | **Discord API rate limits** and interaction round-trips (hundreds of ms) | Network RTT (tens of ms) |
| Shared mutable state | Small: trades, GTS listings, breeding pool, PvP battles, server events / boss HP | Large: positions, physics, world state |
| Hard concurrency problem | **Correctness**: no dupes, no lost progress, atomic multi-entity changes (trade = 2 characters + 2 Pokémon) | **Throughput and fan-out** of state updates |

Rough peak load: 200 servers × 50 concurrently active players × 1 action per 5 s ≈ **2,000 actions/s** in an optimistic future. A single modest MongoDB or Postgres node handles that with room to spare. The bottleneck will be Discord, not the database.

So the database requirements are: **transactions across a few documents, per-character serialization, durable history, flexible nested content, and good TypeScript ergonomics.** Raw realtime throughput is not on the list.

## Options

### A. MongoDB (status quo, done properly): recommended for MVP
- ✅ Content is **document-shaped**: condition trees, script step lists, encounter tables, and compiled release bundles. These are natural documents. In SQL they'd become JSONB anyway.
- ✅ No migration. Existing models, DTO conventions, seed tooling, and `agents.md` all keep working. Zod remains the source of truth.
- ✅ Multi-document **ACID transactions** (needs a replica set, even single-node) cover trades, battle results, and publish.
- ✅ **Change streams** give push notifications (e.g. "your trade offer was accepted", "boss HP changed") without polling. That's the realtime feature you actually need.
- ✅ Atlas has a free tier, point-in-time backups, and easy hosting.
- ❌ No foreign keys or relational constraints. Integrity comes from the validator ([16](16-authoring-validation-and-portability.md)) and code discipline.
- ❌ Transactions have caveats: 60 s default limit, retry on transient errors, and a higher cost than single-doc writes. Design so most actions are single-document (Character), and only trades, battle results, and publishes use transactions.
- ❌ Ad-hoc analytics ("most-used starter across servers") is clunkier than SQL. Use aggregation pipelines or export.

### B. PostgreSQL (+ Drizzle/Kysely, JSONB for content): strongest alternative
- ✅ Relational integrity for the social/economy layer: trades, GTS listings, breeding pools, ownership history. Foreign keys and unique constraints catch bugs that Mongo lets through.
- ✅ `SELECT … FOR UPDATE SKIP LOCKED` is ideal for GTS/Wonder Trade matching queues. `LISTEN/NOTIFY` gives lightweight push.
- ✅ JSONB stores content bundles and condition trees nearly as comfortably as Mongo.
- ✅ Great analytics, mature tooling, and cheap managed hosting (Neon, Supabase, RDS).
- ❌ **Migration cost now:** rewrite 5 models, the DTO layer, seeds, the ERD generator, and the conventions. That's roughly 1–2 weeks of work that delivers no player value.
- ❌ Schema migrations add friction while the model is still changing fast (which it will be through M0–M4).

### C. SpacetimeDB: not recommended as the primary store
SpacetimeDB (Clockwork Labs) is a database and server in one. You write a **module** (Rust, C#, TypeScript, C++). Its **reducers** are transactional functions that run inside the database, against in-memory tables, and clients subscribe to queries and get live updates. TypeScript modules are mature (v2.x in 2026, with submodules added in v2.8). There's hosted Maincloud (Free / $25 Pro / $250 Team) or self-hosted.

Where it shines: MMO-style games with thousands of connected clients needing low-latency state sync. BitCraft runs on it.

Why it's a poor fit here:
- ❌ **Your clients aren't game clients.** The subscribers would be your own bot process and Next.js server, a handful of connections. You'd pay the architectural cost of a client-sync engine and use none of its fan-out strength.
- ❌ **Your whole engine moves into the module.** Reducers are where game logic lives, so `libs/engine`, the condition/effect registries, the script VM, and battle orchestration would all have to run inside SpacetimeDB's module sandbox. That's deep vendor lock-in, in a runtime with constraints (determinism, sandboxed APIs, outbound HTTP only from "procedures") that I couldn't fully confirm. In particular, it's unclear whether the Showdown simulator, `@smogon/calc`, and AI search can run there unmodified. **Spike before ever committing.**
- ❌ **CPU-heavy work blocks transactions.** Turn simulation is cheap, but AI lookahead and batch EXP/evolution processing belong *outside* the transactional core. You'd end up running a second service for them anyway.
- ❌ **License:** Business Source License 1.1, converting to AGPL v3 with a linking exception after a few years. That's fine for a non-profit project using it, but it's not OSI-open today. Clustering/replication is primarily a Maincloud feature.
- ❌ It doesn't fit the stack: Next.js + tRPC + Zod-first models would be replaced by SpacetimeDB's table/reducer/codegen model. FlowCord and Discord.js would become thin clients of a remote module.
- ✅ What would make it interesting later: a **webapp real-time play surface** (Pie in the Sky) with live maps, co-op, or raids watched by many browsers at once. Even then it's better as a *sidecar* for that feature than as the system of record.

### D. Game-server frameworks (Colyseus, Nakama)
- **Colyseus:** room-based realtime state sync over WebSockets for browser/game clients. Irrelevant to a Discord bot. Possibly useful later for a webapp live-battle viewer, but Showdown's protocol plus your own push already covers that.
- **Nakama** (Heroic Labs, Apache 2.0): accounts, matchmaking, leaderboards, chat, and storage, with TypeScript server logic. It largely duplicates what Discord gives you (identity, chat, community) and what you're building (engine). Its storage engine is CockroachDB/Postgres underneath. Not worth the operational weight.

### E. Reactive TS backends (Convex, Supabase Realtime)
- **Convex:** transactional TypeScript functions with reactive queries. Great DX for Next.js, but the same lock-in concern as SpacetimeDB (logic lives in their runtime), and Discord bots aren't its sweet spot.
- **Supabase:** essentially option B plus hosted realtime. Consider it *as the host* if you ever move to Postgres.

## Comparison

| Criterion (weight) | MongoDB | PostgreSQL | SpacetimeDB | Nakama |
|---|---|---|---|---|
| Fits event-driven, human-paced Discord workload (high) | ✅ | ✅ | ⚠️ overbuilt | ⚠️ overbuilt |
| Multi-entity atomicity: trades, battle results (high) | ✅ (replica set) | ✅✅ | ✅✅ (reducers) | ✅ |
| Nested/flexible content: scripts, conditions, bundles (high) | ✅✅ | ✅ (JSONB) | ⚠️ (tables, product types) | ⚠️ |
| Keeps the engine portable, no lock-in (high) | ✅ | ✅ | ❌ | ⚠️ |
| Runs Showdown/AI alongside (high) | ✅ | ✅ | ❓ needs spike | ✅ (separate) |
| Realtime push to bot/webapp (medium) | ✅ change streams | ✅ LISTEN/NOTIFY | ✅✅ | ✅✅ |
| Migration cost from today (medium) | none | ~1–2 weeks | rewrite | rewrite |
| Hosting cost / ops (medium) | low | low | low–medium | medium |
| Relational integrity for social/economy (Phase 3) | ⚠️ | ✅✅ | ✅ | ✅ |

## Recommendation

1. **Stay on MongoDB for MVP.** Set it up properly ([15](15-persistence-caching-concurrency.md)):
   - Run a replica set, even locally.
   - Declare unique indexes.
   - Use transactions only for multi-entity operations.
   - Use change streams for push notifications.
   - Add a per-character lock plus optimistic concurrency.
2. **Keep the database swappable.** `libs/engine` talks to `CharacterRepo`, `PokemonRepo`, `TradeRepo`, `ContentProvider`, etc., and never imports Mongoose. That's the real hedge. If you move to Postgres later, it's a repository rewrite, not an engine rewrite.
3. **Add Redis when you run more than one bot process** (Discord sharding): distributed locks, cache, pub/sub between shards, and live-battle routing. Not before.
4. **Phase 3 checkpoint:** before building trading, GTS, and breeding pools, re-evaluate Postgres. Trigger it if Mongo transactions prove painful, if you need marketplace-style queries (filtering GTS listings by complex criteria), or if analytics becomes important.
5. **SpacetimeDB is shelved** (see the decision above). It's only relevant to a future real-time webapp play surface. If you want to test it, timebox a 2-day spike: run one PvP battle (Showdown sim) inside a TypeScript module, with the bot as a subscriber. That would turn the open questions above into facts.

## Open questions
- ~~Do you foresee many simultaneous real-time viewers in a webapp?~~ Answered: no. Live PvP and spectating stay in Discord, and a webapp-first move is ~1–2% likely.
- ~~Hosting preference?~~ **Decided (Q30):** managed Atlas (Free → Flex) on a managed app host. See [21](21-hosting-and-environments.md).
- ~~SQL vs document modeling?~~ **Decided (Q33):** stay on MongoDB. Managed Postgres costs about the same at this size, so cost doesn't reopen it.

## Sources
- [SpacetimeDB GitHub (license, module languages)](https://github.com/clockworklabs/SpacetimeDB)
- [SpacetimeDB releases](https://github.com/clockworklabs/SpacetimeDB/releases)
- [SpacetimeDB pricing](https://spacetimedb.com/pricing) and [pricing announcement](https://spacetimedb.com/blog/all-new-spacetimedb-pricing)
- [SpacetimeDB reducers](https://spacetimedb.com/docs/functions/reducers/), [schedule tables](https://spacetimedb.com/docs/tables/schedule-tables/), [key architecture](https://spacetimedb.com/docs/intro/key-architecture/), [submodules](https://spacetimedb.com/docs/submodules/)
- [Colyseus talk](https://gitnation.com/contents/making-multiplayer-games-with-colyseus-nodejs-and-typescript), [Nakama vs Colyseus forum thread](https://forum.heroiclabs.com/t/nakama-vs-colyseus/1632), [backend comparison](https://comparegamebackends.netlify.app/backends)
