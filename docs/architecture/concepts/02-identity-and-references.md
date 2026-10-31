# 02: Identity & References

> **TL;DR:** Reference *content* by stable **string keys**. Use Showdown IDs for canon data (`bulbasaur`, `potion`, `thunderbolt`) and generated keys for authored data. Keep ObjectIds for *documents* (characters, journeys, Pokémon instances, servers). Store each relationship in **one direction only** (child → parent).

**MVP impact:** High · **Cost to change later:** High (every stored reference)

## Current shape

| Reference | Today | Issue |
|---|---|---|
| Region → Locations | `Region.locations: ObjectId[]` **and** `Location.regionId` | Two sources of truth, non-atomic updates |
| Server → Regions | `Server.regions: ObjectId[]` only | Region doesn't know its server, so ownership checks need a reverse lookup |
| Server ↔ Users | `Server.playerList[]` **and** `User.servers[]` | Duplicated and unbounded |
| Region → Journeys | `Region.characterList[]` | Unbounded (thousands of players) |
| Encounter slot → species | `speciesId: ObjectId` (DexEntry) | Not portable. Showdown needs the string ID anyway. |
| Requirement → item | `itemId: ObjectId` (`Item` model doesn't exist) | Same |
| Connection → location | `toLocationId: ObjectId` | Fine at runtime. Painful for templates/import (needs remapping). |
| Progression keys | bare UUID; milestones `milestone-<uuid>` | Good (stable, hidden). Inconsistent prefixing. |

## Principles

1. **Documents vs content entries.** A *document* has independent lifecycle and concurrency (Character, Journey, PokemonInstance, Server, User, RegionRelease). A *content entry* is part of a region's authored package (location, NPC, script, shop, encounter table).
   - Documents use ObjectIds.
   - Content entries use a **key that is unique within the region** and survives export/import/clone.
2. **Canon catalog uses Showdown IDs.** Showdown's `toID()` keys (`mrmime`, `kingsrock`, `hiddenpowerfire`) are what the simulator, the team validator, `@smogon/calc`, and sprite CDNs all use. Storing `speciesId: "pikachu"` means no translation layer on the battle hot path.
3. **Custom content gets namespaced IDs.** Server library content uses `<publisherId>:<slug>` (e.g. `p7k2m9x4:sparkitten`), where `publisherId` is an opaque, immutable, system-generated namespace. Its display name (default: server name) is shown in the UI, and ownership can move between servers. Showdown IDs never contain `:`, so these can never collide with canon (current or future) or with other servers' content. **Overrides** of canon species deliberately reuse the canon ID. See [12 § Species identity](12-content-catalog-species-moves-items.md#species-identity-canon-custom-species-variants-overrides--sharing-decided-oct-2026-q19).
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

**How lookups work (clarification).**
- **Unique within the region, not globally.** There's a unique index on `{ regionId, key }`. A key is *not* a link back to a copy's source. Clone provenance, where it matters, is recorded once at region level (`Region.clonedFrom: { regionId, releaseVersion }`), not per entry.
- **References only ever use the key.** `_id` is just Mongo's storage handle and is never stored in another document. Each content entry still has exactly one identity that matters.
- **Scoped by `regionId` only, never `serverId`.** `regionId` is a global ObjectId. Content references never cross regions (cross-region things like library species use globally unique IDs), and every authoring command already carries the region it edits.
- **Runtime does no DB graph fetching at all.** The engine reads the compiled release bundle in memory, where the graph is `Map<key, Location>` plus adjacency lists, so traversal is a hash lookup. Draft-side lookups are `findOne({ regionId, key })`, which is as fast as `findById` with the compound index.
- **Guardrail against forgetting the scope:** repositories never expose key-only lookups. Signatures require the region (`locations.get(regionId, key)`), so an unscoped query can't be written by accident. The cost is that Mongoose `populate` by key needs virtuals. We don't plan to use populate for content anyway.
- **Locked in (Oct 2026)** after reviewing the worked example below. **Considered alternative:** use `_id` everywhere and remap references on clone/import, with a schema walker that finds every branded `ContentRef` field (including inside condition trees and script steps). That's viable, with one identity and `findById` working, but copies, imports, and future "pull template fixes into my clone" flows all need remap logic. The separate key avoids that. Rejected: template import/modify/update is a core use case.

**Who sees keys?** Nobody, in normal use. Players never see them. Authors see names in every builder (Discord and webapp), with names resolved from the key through the same presentation-layer idea used for publishers. Keys only appear in raw JSON export/import and logs. There, the exporter writes a non-authoritative `_label` next to each reference (`{ "to": "k3f9a1x7qz", "_label": "Route 1" }`) so humans can read the file. Import ignores `_label`.

## Recommendation

- Introduce a shared `ContentKey` type (opaque, ~10-char `nanoid`) and generator. Use it for locations, NPCs, trainers, scripts, shops, transport networks, and encounter tables. Keep the existing progression/milestone UUIDs (already valid opaque keys).
- Content cross-references use keys: `connection.to: ContentKey`, `encounterSlot.species: SpeciesId`, `itemCondition.item: ItemId`.
- Drop `Region.locations`, `Region.characterList`, `Region.shops`, `Region.quests`, and `Server.playerList`. Add `Region.serverId`. Add indexes (`{ regionId, key }` unique, `Location {regionId, ordinal}`, `Journey {userId, regionId}` unique among active journeys, etc.).

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
- This is a **one-directional user preference** (user → servers). Servers never list users. "Players in this server" comes from Journeys or a membership query.

### Do authored content entries stay as separate Mongo docs?
Yes, for the **draft** (one doc per location/NPC/script keeps authoring writes small and concurrent-safe). The **release** compiles them into a keyed bundle (see [01](01-content-vs-state-and-publishing.md)). The engine resolves references against the bundle's in-memory maps, never with populates.

### Event regions (post-MVP)
Server event content that isn't specific to one region (e.g. an event island every player visits) lives in an **event region**: a server-owned region of kind `event`. Its content keys are its own, so the identity rules above apply unchanged: nothing about events needs server-global content keys. Journeys visit it temporarily (see [23 § Event regions and visiting](23-players-characters-journeys-and-scopes.md#event-regions-and-visiting-post-mvp)).

## MVP scope
- ContentKey type and generator. Migrate Location to have a `key`. Species and item references become Showdown IDs. Remove the bidirectional arrays. Add indexes.

## Open questions
- ~~Regions shared across servers?~~ **Decided (Q23):** no live sharing. Each region belongs to one server, and sharing means importing a copy, so `Region.serverId` is enough.
- ~~DexEntry `_id` vs Showdown ID?~~ **Decided (Oct 2026):** `_id` stays an ObjectId. The existing `showdownName` field is **renamed `speciesId`** (it already holds the Showdown ID) and becomes the reference key everywhere, including DexEntry's own `baseSpecies`/`prevo`/`evos`/`formes` links. It's unique among canon entries only; library overrides and imports share species IDs by design (see [12 § Mongo shape](12-content-catalog-species-moves-items.md#mongo-shape)).

## Worked example: copying a template region to another server

**Setup.** The PokeSandbox HQ server publishes a "Kanto Classic" template region. The Pallet Paradise server imports it, then modifies it.

### 1. In the template's server (draft documents)
```jsonc
// regions
{ "_id": "R_A", "serverId": "S_HQ", "name": "Kanto Classic", "startingLocationKey": "Lp4Xk9aQ2m",
  "progressionDefinitions": { "6f1c…uuid": { "kind": "milestone", "name": "Badges",
      "milestones": [ { "key": "milestone-91ab…", "label": "Boulder Badge" } ] } } }

// locations
{ "_id": "L_A1", "regionId": "R_A", "key": "Lp4Xk9aQ2m", "name": "Pallet Town",
  "edges": [ { "to": "Rr1Zt8wB3c" } ] }
{ "_id": "L_A2", "regionId": "R_A", "key": "Rr1Zt8wB3c", "name": "Route 1",
  "edges": [ { "to": "Lp4Xk9aQ2m" }, { "to": "Vv7Qm2pL0d" } ],
  "encounters": [ { "method": "grass", "slots": [ { "species": "pidgey", "minLevel": 2, "maxLevel": 5, "weight": 50 } ] } ] }
{ "_id": "L_A3", "regionId": "R_A", "key": "Vv7Qm2pL0d", "name": "Viridian City",
  "edges": [ { "to": "Rr1Zt8wB3c" }, { "to": "Gy5Hn3sK8e",
      "gate": { "condition": { "fact": { "kind": "milestoneCount", "key": "6f1c…uuid" }, "op": "gte", "value": 7 },
                "presentation": "locked" } } ] }

// npcs
{ "_id": "N_A1", "regionId": "R_A", "key": "Nb2Rk6yT1w", "name": "Brock", "location": "Pw3Gm8cX5v", "interact": "Sc9Ld4fJ7u" }
```

### 2. Import into another server = copy the documents, keep the keys
```jsonc
// regions (new doc, new _id, new owner)
{ "_id": "R_B", "serverId": "S_PALLET", "name": "Kanto Classic", "startingLocationKey": "Lp4Xk9aQ2m",
  "clonedFrom": { "regionId": "R_A", "releaseVersion": 3 },
  "progressionDefinitions": { "6f1c…uuid": { … identical … } } }

// locations: new _ids, new regionId, everything else byte-for-byte identical
{ "_id": "L_B1", "regionId": "R_B", "key": "Lp4Xk9aQ2m", "name": "Pallet Town",   "edges": [ { "to": "Rr1Zt8wB3c" } ] }
{ "_id": "L_B2", "regionId": "R_B", "key": "Rr1Zt8wB3c", "name": "Route 1",       "edges": [ { "to": "Lp4Xk9aQ2m" }, { "to": "Vv7Qm2pL0d" } ], … }
{ "_id": "L_B3", "regionId": "R_B", "key": "Vv7Qm2pL0d", "name": "Viridian City", "edges": [ … same gate, same progression key … ] }
```
The copy changed only `_id` and `regionId`. Every reference (edges, the gate's progression key, Brock's location and script, the start location) is already correct, because each key is resolved *within the region it's read in*:
```ts
locations.get('R_B', 'Vv7Qm2pL0d')  // → L_B3, Pallet Paradise's Viridian
locations.get('R_A', 'Vv7Qm2pL0d')  // → L_A3, the template's Viridian
```
Global references are untouched by design: `pidgey` (canon) and `p7k2m9x4:sparkitten` (library species) mean the same thing everywhere. Library entries the template uses are brought along as *linked* imports (see [12](12-content-catalog-species-moves-items.md)).

### 3. The importer modifies their copy
```jsonc
{ "_id": "L_B2", "regionId": "R_B", "key": "Rr1Zt8wB3c", "name": "Route 1 (Tall Grass)",           // renamed
  "edges": [ { "to": "Lp4Xk9aQ2m" }, { "to": "Vv7Qm2pL0d" }, { "to": "Hd6Wq1zN4r" } ] }             // new edge
{ "_id": "L_B9", "regionId": "R_B", "key": "Hd6Wq1zN4r", "name": "Hidden Grove", "edges": [ { "to": "Rr1Zt8wB3c" } ] }  // new location
```
The template (`R_A`) is untouched. Renames never touch keys.

### 4. Later: the template publishes a fix (why stable keys pay off)
HQ changes Viridian's gym gate from 7 to 8 badges in release v4. Because both copies share keys, the importer can be shown a **per-entry diff by key** and offered a merge, the same three-way logic as linked library entries:

| Key | Template v3 → v4 | Your copy | Result |
|---|---|---|---|
| `Vv7Qm2pL0d` (Viridian) | gate 7 → 8 | unchanged | take the update |
| `Rr1Zt8wB3c` (Route 1) | unchanged | renamed, edge added | keep yours |
| `Hd6Wq1zN4r` (Hidden Grove) | doesn't exist | added by you | keep yours |

"Pull template updates" is post-MVP, but this is the identity that makes it possible.

### The same import with `_id` references instead (the alternative)
Every reference must be rewritten during the copy:
```jsonc
// template:  { "_id": "L_A2", "edges": [ { "to": "L_A1" }, { "to": "L_A3" } ] }
// copy must become: { "_id": "L_B2", "edges": [ { "to": "L_B1" }, { "to": "L_B3" } ] }
```
That means building an old→new map and walking every reference field in every content type: edges, gates, condition facts, NPC locations, script steps (`travel`, `battle` trainer refs), shop locations, transport hubs, start/respawn location. A missed field silently points the copy at the template's data. And the step-4 merge would need that mapping stored forever to tell which copied entry corresponds to which template entry.
