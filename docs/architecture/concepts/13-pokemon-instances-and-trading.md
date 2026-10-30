# 13: Pokémon Instances & Trading

> **TL;DR:** Owned Pokémon are **their own collection**, each owned by a journey ([23](23-players-characters-journeys-and-scopes.md)) with an explicit `storage` location (party slot / box slot / daycare / GTS / loaned). They use a **Showdown-compatible set shape** plus persistent state fields, so a Pokémon converts to a battle set with no mapping layer. The original trainer is the *character*. Player-to-player and in-game NPC trades are in the MVP. Arena team presets are separate from owned Pokémon ([25](25-arena.md)).

**MVP impact:** Very high · **Cost to change later:** Very high

## Pokémon instance
```ts
PokemonInstance {
  _id; ownerJourneyId; originalTrainer: { characterId; name; idNo };   // the original trainer is the character
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
| A. Embed party + boxes in the journey | One doc, atomic writes, simple | Unbounded growth (boxes hold hundreds). Every bag change rewrites a big doc. **Trading, GTS, breeding pools, Wonder Trade, and PvP-with-adventure-party all need to move Pokémon *between* journeys**, which with embedding means a cross-document dance anyway. |
| B. Embed party, separate collection for boxes | Party reads are fast | Two storage models for the same entity. Moving party↔box changes collections. |
| **C. All instances in one collection, `storage` field** (chosen) | Uniform. Trades are an `ownerJourneyId` update. GTS and breeding pools are queries. Easy box paging. | Party read = indexed query (`ownerJourneyId, storage.kind`) or a `partyOrder` lookup. Multi-doc writes (battle results touch 6 Pokémon + the journey) want **transactions** (requires a Mongo replica set; see [15](15-persistence-concurrency-and-runtime.md)). |

## Game-dev notes
- **HP/status persist** between battles (heal at Centers). The fork's HP injection (or a battle construction hook) is needed. See [14](14-battle-system-and-showdown.md).
- **EXP, levels, evolution, and move learning happen in the engine**, using DexEntry growth rates and Showdown learnsets. Evolution prompts ("What? Charmander is evolving!", cancelable) and move-replacement prompts are **script-like blocking interactions**, so reuse the mode machinery.
- **Evolution triggers (decided Oct 2026):** Gen 1 needs only level, stone, and trade (MVP). Post-MVP, an evolution can carry a `Condition` ([05](05-requirements.md)) evaluated when it would fire, e.g. "at L30 while in a location tagged `forest`". This covers Gen 4+ place-based evolutions and lets one species branch by terrain or location without new trigger types.
- **Original Trainer/ID** drives Gen 1 rules for traded Pokémon (trading is MVP, see Trading below). Traded Pokémon (original trainer ≠ the owning journey's character) gain **1.5× EXP**, and **obey only up to a badge-based level cap**: 10 with no badges, 30 with Cascade, 50 with Rainbow, 70 with Marsh, all with Earth. Both are region rules (`formulas.exp` traded bonus, `systems.obedience`).

## Decisions (Oct 2026, Q22)
- **Option C:** all owned Pokémon live in one `PokemonInstance` collection with an owner and a `storage` location. Battle results, trades, and swaps use transactions (Mongo replica set).
- **Party order** is an ordered list of ≤ 6 instance IDs on the journey (`partyOrder`). Box contents come from each instance's `storage` field.
- **Released Pokémon** are soft-deleted (`releasedAt`), kept for history and anti-abuse audits, then purged after **30 days**. The same applies to a Pokémon sent away in an in-game NPC trade (`reason: 'npcTrade'`). The permanent record is the adventure log: a `release` entry, and Pokémon stored as snapshots in every entry, so nothing in the log breaks after the purge ([22](22-adventure-log-and-narration.md)).
- **Original trainer** is recorded from day one as the **character** (character ID, name, ID number). It's needed for Gen 1's traded-Pokémon rules, and it's what lets a character carry Pokémon between regions later without them counting as traded ([23](23-players-characters-journeys-and-scopes.md#playing-more-than-one-region-post-mvp)).

## Trading (decided Oct 2026, MVP, Q35)
Low-fidelity player-to-player trading is in the MVP. Wonder Trade, GTS-style listings, and cross-region or cross-server trades are not.

```ts
Trade {
  _id; regionId;                                  // both journeys are in this region
  sides: [{ journeyId; offer?: PokemonInstanceId; confirmed: boolean }, { … }];
  channelId; messageId;                           // the shared trade message
  status: 'open' | 'completed' | 'cancelled' | 'expired';
  expiresAt;
}
```

- **Flow:** a player proposes a trade to another player in the same region. Each side picks one Pokémon privately (a prompt opened from the shared trade message, the same pattern as the Arena's private choice prompts in [25](25-arena.md#ownership)). Both confirm. **Changing an offer clears both confirmations**, so nobody is switched at the last second. Offers expire.
- **Execution is one engine action across two journeys.** `dispatch` takes both journeys' leases in a fixed order (sorted by journey ID) so concurrent trades can't deadlock, then re-checks everything against fresh state: both sides still own the offered Pokémon, neither journey is in battle or a script, and neither trade leaves a party empty. It swaps `ownerJourneyId` (and storage) in one transaction, bumps both journeys' `rev`, and updates both Pokédexes (seen/caught).
- **Where:** `RegionRules.systems.trading.access: 'pcLocation' | 'anywhere'` ([18](18-rules-time-and-randomness.md)). Gen 1 Classic uses `'pcLocation'` (the Cable Club in every Pokémon Center), checked like any action precondition ([03](03-engine-boundary-and-game-loop.md#per-journey-serialization-revisions-preconditions-and-sessions-decided-oct-2026)).
- **After the trade:** trade evolutions (Kadabra, Machoke, Graveler, Haunter) fire as the receiver's post-trade evolution prompt, the same interaction as post-battle evolution. The Gen 1 traded-Pokémon rules (EXP bonus, obedience caps) apply automatically because the original trainer differs. Both journeys get an adventure log entry (`kind: 'trade'`).
- **In-game NPC trades are also MVP**, as the `npcTrade` script step ([07](07-scripts-triggers-and-events.md)): no second player, same post-trade evolution and traded-Pokémon rules.
- **Trade evolution without trading** (e.g. a Linking Cord-style item or a level, for solo players): **post-MVP**, a configurable region rule (`RegionRules.systems.tradeEvolutions`, reserved; default: trade only).
- **Abuse limits:** same-region only, a per-user rate limit, and every trade logged. Self-trading through alt accounts can't be fully prevented, but it's visible in the logs.

## MVP scope
- PokemonInstance (party + boxes, owned by a journey) and conversion `PokemonInstance → PokemonSet + state`.
- Box UI, deposit/withdraw/release.
- Player trading (above).

## Open questions
- Characters, journeys, name slots, privacy, and restarts moved to [23](23-players-characters-journeys-and-scopes.md). Arena teams and adventure Pokémon in the Arena moved to [25](25-arena.md).
