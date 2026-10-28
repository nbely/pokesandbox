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

Authored content (locations, NPCs, trainers, scripts, shops, transport networks, encounter tables) needs a reference key that is:
1. **Stable**: never changes on rename or edit.
2. **Copy-safe**: survives cloning a region (templates, sequels), importing a bundle, duplicating an entry, and compiling a release, **without remapping references**.

The second property is the reason a separate key exists at all. If references used the Mongo `_id`, every copy would create new `_id`s and every reference field in every content type would need rewriting. One missed field silently points the copy at the template's original content.

| Option | Pros | Cons |
|---|---|---|
| Mongo `_id` as the reference | Native, nothing new | Copies need a full reference remap across every schema. Missed fields fail silently. |
| Slug + suffix (`route-1~k3f9`) | Readable in raw JSON | The readability only matters in raw exports. It adds a generator, uniqueness rules, and a frozen slug that goes stale after renames. |
| **Opaque region-scoped key, separate from `_id`** (decided Oct 2026) | Copies keep keys verbatim, so no remapping. Rename-safe. A tiny generator (`nanoid`, ~10 chars). Matches the existing progression/milestone keys (already opaque UUIDs, not `_id`s). | One extra indexed field (`{ regionId, key }` unique) |

**Who sees keys?** Nobody, in normal use. Players never see them. Authors see names in every builder (Discord and webapp), with names resolved from the key through the same presentation-layer idea used for publishers. Keys only appear in raw JSON export/import and logs. There, the exporter writes a non-authoritative `_label` next to each reference (`{ "to": "k3f9a1x7qz", "_label": "Route 1" }`) so humans can read the file. Import ignores `_label`.

## Recommendation

- Introduce a shared `ContentKey` type (opaque, ~10-char `nanoid`) and generator. Use it for locations, NPCs, trainers, scripts, shops, transport networks, and encounter tables. Keep the existing progression/milestone UUIDs (already valid opaque keys).
- Content cross-references use keys: `connection.to: ContentKey`, `encounterSlot.species: SpeciesId`, `itemCondition.item: ItemId`.
- Drop `Region.locations`, `Region.characterList`, `Region.shops`, `Region.quests`, and `Server.playerList`. Add `Region.serverId`. Add indexes (`{ regionId, key }` unique, `Location {regionId, ordinal}`, `Character {userId, regionId}` unique, etc.).

### A user's server list (decided Oct 2026)
Replaces `User.servers` / `Server.playerList` (no bidirectional arrays). The webapp's left nav (Discord-style) combines two sources:

| Source | Stored? | How |
|---|---|---|
| **Membership:** registered PokeSandbox servers you're in on Discord | **No, derived** | From the user's Discord guild list (OAuth `guilds` scope; refreshed on login and periodically, briefly cached) intersected with registered servers. Leaving a Discord server removes it automatically. |
| **Favorites:** servers you saved from discovery to check out later | **Yes** | User preference |
| **Layout:** order, folders/groups (name, color), collapsed state | **Yes** | User preference, like Discord's server folders |

```ts
UserNavLayout {             // one doc per user (or embedded on User; it's bounded by the user's own actions)
  userId;
  favorites: ObjectId[];    // serverIds the user explicitly saved
  items: ( { type: 'server'; serverId } | { type: 'folder'; id; name; color?; collapsed?; serverIds: ObjectId[] } )[];
}
```
- Rendering = `items` order first, then any member/favorite servers not yet placed (appended in default order). Stale entries (server deleted, membership gone and not favorited) are pruned lazily.
- This is a **one-directional user preference** (user → servers). Servers never list users. "Players in this server" comes from Characters or a membership query.

### Do authored content entries stay as separate Mongo docs?
Yes, for the **draft** (one doc per location/NPC/script keeps authoring writes small and concurrent-safe). The **release** compiles them into a keyed bundle (see [01](01-content-vs-state-and-publishing.md)). The engine resolves references against the bundle's in-memory maps, never with populates.

## MVP scope
- ContentKey type and generator. Migrate Location to have a `key`. Species and item references become Showdown IDs. Remove the bidirectional arrays. Add indexes.

## Open questions
- Will regions ever be **shared across servers** (a published "Kanto Classic" that many servers deploy)? If yes, Region needs `ownerServerId` plus a separate "installation" concept. If no, `Region.serverId` is enough.
- Should DexEntry keep ObjectId `_id`s at all, or switch `_id` to the Showdown ID string? (Recommendation: `_id` can stay, but add a unique `speciesId` string field and reference by that.)
