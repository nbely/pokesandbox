# 02: Identity & References

> **TL;DR:** Reference *content* by stable **string keys**. Use Showdown IDs for canon data (`bulbasaur`, `potion`, `thunderbolt`) and generated keys for authored data. Keep ObjectIds for *documents* (characters, Pokémon instances, servers). Store each relationship in **one direction only** (child → parent).

**MVP impact:** High · **Cost to change later:** High (every stored reference)

## Current shape

| Reference | Today | Issue |
|---|---|---|
| Region → Locations | `Region.locations: ObjectId[]` **and** `Location.regionId` | Two sources of truth, non-atomic updates |
| Server → Regions | `Server.regions: ObjectId[]` only | Region doesn't know its server, so ownership checks need a reverse lookup |
| Server ↔ Users | `Server.playerList[]` **and** `User.servers[]` | Duplicated and unbounded |
| Region → Characters | `Region.characterList[]` | Unbounded (thousands of players) |
| Encounter slot → species | `speciesId: ObjectId` (DexEntry) | Not portable. Showdown needs the string ID anyway. |
| Requirement → item | `itemId: ObjectId` (`Item` model doesn't exist) | Same |
| Connection → location | `toLocationId: ObjectId` | Fine at runtime. Painful for templates/import (needs remapping). |
| Progression keys | bare UUID; milestones `milestone-<uuid>` | Good (stable, hidden). Inconsistent prefixing. |

## Principles

1. **Documents vs content entries.** A *document* has independent lifecycle and concurrency (Character, PokemonInstance, Server, User, RegionRelease). A *content entry* is part of a region's authored package (location, NPC, script, shop, encounter table).
   - Documents use ObjectIds.
   - Content entries use a **key that is unique within the region** and survives export/import/clone.
2. **Canon catalog uses Showdown IDs.** Showdown's `toID()` keys (`mrmime`, `kingsrock`, `hiddenpowerfire`) are what the simulator, the team validator, `@smogon/calc`, and sprite CDNs all use. Storing `speciesId: "pikachu"` means no translation layer on the battle hot path.
3. **Custom content gets namespaced IDs.** Server library content uses `<publisherId>:<slug>` (e.g. `p7k2m9x4:sparkitten`), where `publisherId` is an opaque, immutable, system-generated namespace. Its display name (default: server name) is shown in the UI, and ownership can move between servers. Showdown IDs never contain `:`, so these can never collide with canon (current or future) or with other servers' content. **Overrides** of canon species deliberately reuse the canon ID. See [12 § Species identity](12-content-catalog-species-moves-items.md#species-identity-canon-custom-species-variants-overrides--sharing-proposed-oct-2026).
4. **One-directional ownership.** The child stores the parent ID and the parent doesn't store a child list. Query by indexed parent ID, and keep explicit ordering in an `ordinal` field (as `Location.ordinal` already does).
5. **Keys are opaque.** Never parse meaning out of a key. Display names live in fields.

## Options for authored content keys

| Option | Example | Pros | Cons |
|---|---|---|---|
| ObjectId (status quo) | `69a66f9c…` | Native, free | Needs remapping on clone/import. Unreadable in JSON exports and scripts. |
| UUID | `3f2a…` | Globally unique, clone-safe if you re-key | Unreadable. Clones keep identical keys unless rekeyed (that's fine, since keys are region-scoped). |
| **Slug + short suffix** (recommended) | `route-1~k3f9`, `npc:brock~a12c` | Readable in exports, logs, and future script files. Stable under rename (the slug is just a hint). Region-scoped uniqueness is easy. | Slightly more code (generator + uniqueness check). |

Rename should **not** change the key. The slug part is cosmetic, frozen at creation.

## Recommendation

- Introduce a shared `ContentKey` type (`z.string().regex(...)`) and a generator. Use it for locations, NPCs, trainers, scripts, shops, transport networks, encounter tables, and progression/milestone keys (keep existing UUIDs; they're valid opaque keys).
- Content cross-references use keys: `connection.to: ContentKey`, `encounterSlot.species: SpeciesId`, `itemCondition.item: ItemId`.
- Drop `Region.locations`, `Region.characterList`, `Region.shops`, `Region.quests`, and `Server.playerList`. Add `Region.serverId`. Add indexes (`Location {regionId, ordinal}`, `Character {userId, regionId}` unique, etc.).
- Keep `User.servers` only if the webapp really needs "my servers" without a membership query. Otherwise derive it from Characters/memberships.

### Do authored content entries stay as separate Mongo docs?
Yes, for the **draft** (one doc per location/NPC/script keeps authoring writes small and concurrent-safe). The **release** compiles them into a keyed bundle (see [01](01-content-vs-state-and-publishing.md)). The engine resolves references against the bundle's in-memory maps, never with populates.

## MVP scope
- ContentKey type and generator. Migrate Location to have a `key`. Species and item references become Showdown IDs. Remove the bidirectional arrays. Add indexes.

## Open questions
- Will regions ever be **shared across servers** (a published "Kanto Classic" that many servers deploy)? If yes, Region needs `ownerServerId` plus a separate "installation" concept. If no, `Region.serverId` is enough.
- Should DexEntry keep ObjectId `_id`s at all, or switch `_id` to the Showdown ID string? (Recommendation: `_id` can stay, but add a unique `speciesId` string field and reference by that.)
