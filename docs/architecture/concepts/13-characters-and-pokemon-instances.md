# 13: Characters & Pokémon Instances

> **TL;DR:** Make **Character** a compact save-state document (position, money, bag, progress, flags, mode, release version). Make **Pokémon instances their own collection** with an explicit `storage` location (party slot / box slot / daycare / GTS / loaned). Use a **Showdown-compatible set shape** plus persistent state fields, so a Pokémon converts to a battle set with no mapping layer. Separate PvP-arena **team presets** from owned Pokémon.

**MVP impact:** Very high · **Cost to change later:** Very high

## Proposed Character
```ts
Character {
  _id; userId; serverId; regionId; name; createdAt;
  releaseVersion: number;                        // see 01
  mode: { type: 'overworld' } | { type: 'script'; … } | { type: 'battle'; battleId };   // see 03
  location: { current: ContentKey; respawn: ContentKey; visited: ContentKey[] };
  money: number;
  bag: Record<ItemId, number>;                   // pockets derived from ItemDefinition
  progress: Record<progressionKey, number | boolean | string | string[]>;
  flags: string[];
  dex: { seen: SpeciesId[]; caught: SpeciesId[] };   // or a bitset/map. Small either way.
  partyOrder: ObjectId[];                         // ≤ 6 Pokémon instance ids (order = lead first)
  boxes: { name: string; wallpaper?: string }[];  // metadata only. Membership lives on the Pokémon.
  status: { repelSteps?: number; … };
  stats: { battlesWon: number; steps?: number; playTimeSec?: number; … };
  recentExecutions: string[];                     // idempotency ring buffer (see 06)
  version: number;                                // optimistic concurrency
}
// unique index: { userId, regionId } (1 per region per your roadmap. Make N configurable later.)
```

## Proposed Pokémon instance
```ts
PokemonInstance {
  _id; ownerCharacterId; originalTrainer: { characterId; name; idNo };
  storage: { kind: 'party' } | { kind: 'box'; box: number; slot: number } | { kind: 'daycare' } | { kind: 'gts'; listingId } | { kind: 'loan'; returnTo }; 
  // Showdown PokemonSet-compatible
  species: SpeciesId; forme?; nickname?; gender; shiny; level; nature; ability; item?;
  ivs; evs; moves: { id: MoveId; pp: number; ppUps: number }[]; teraType?; 
  // persistent state Showdown doesn't keep between battles
  exp: number; hp: number; status?: 'brn' | 'par' | 'slp' | 'frz' | 'psn' | 'tox'; friendship: number;
  ball: ItemId; met: { location: ContentKey; level: number; at: Date; method: 'wild' | 'gift' | 'egg' | 'trade' };
  ribbons?: string[]; pokerus?: …;
}
```

## Options: embed vs separate collection

| Option | Pros | Cons |
|---|---|---|
| A. Embed party + boxes in Character | One doc, atomic writes, simple | Unbounded growth (boxes hold hundreds). Every bag change rewrites a big doc. **Trading, GTS, breeding pools, Wonder Trade, and PvP-with-adventure-party all need to move Pokémon *between* characters**, which with embedding means a cross-document dance anyway. |
| B. Embed party, separate collection for boxes | Party reads are fast | Two storage models for the same entity. Moving party↔box changes collections. |
| **C. All instances in one collection, `storage` field** (recommended) | Uniform. Trades are an `ownerCharacterId` update. GTS and breeding pools are queries. Easy box paging. | Party read = indexed query (`ownerCharacterId, storage.kind`) or a `partyOrder` lookup. Multi-doc writes (battle results touch 6 Pokémon + Character) want **transactions** (requires a Mongo replica set; see [15](15-persistence-caching-concurrency.md)). |

## PvP Arena teams (Pre-MVP)
Arena teams aren't owned Pokémon. They're **TeamPresets**:

```ts
TeamPreset { _id; userId; serverId; formatId (ArenaFormat that validates it, server-scoped, see 14); name; sets: PokemonSet[] /* Showdown set shape */; }
```

Using the same `PokemonSet` shape means the arena's team builder, validator, and battle hookup are **reused** for adventure battles later. Allow **Showdown paste import/export** in the arena team builder. It's the fastest team-building UX possible in Discord (one modal) and the format competitive players already know.

## Game-dev notes
- **HP/status persist** between battles (heal at Centers). The fork's HP injection (or a battle construction hook) is needed. See [14](14-battle-system-and-showdown.md).
- **EXP, levels, evolution, and move learning happen in the engine**, using DexEntry growth rates and Showdown learnsets. Evolution prompts ("What? Charmander is evolving!", cancelable) and move-replacement prompts are **script-like blocking interactions**, so reuse the mode machinery.
- **Original Trainer/ID** matters later for trading obedience rules and "traded Pokémon gain more EXP".

## MVP scope
- Character, PokemonInstance (party + boxes), TeamPreset (arena), and conversion `PokemonInstance → PokemonSet + state`.
- Box UI, deposit/withdraw/release.

## Open questions
- Is **1 character per region** firm for MVP? `Region.charactersPerPlayer` suggests N. (Recommendation: enforce 1 now, keep the field.)
- Can a user **delete/restart** a character? Does the old one get archived?
- Should the arena allow using **adventure Pokémon** later (Full roadmap says "in-game PvP" with adventure parties)? With option C that's a query, not a migration.
