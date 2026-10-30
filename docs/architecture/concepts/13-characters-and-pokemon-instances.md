# 13: Characters, Journeys & Pokémon Instances

> **TL;DR:** A **Character** is the persona a player plays as (name, ID number, profile); a **Journey** is that character's playthrough of one region, a compact save-state document (position, money, bag, progress, flags, mode, release version). Make **Pokémon instances their own collection** with an explicit `storage` location (party slot / box slot / daycare / GTS / loaned). Use a **Showdown-compatible set shape** plus persistent state fields, so a Pokémon converts to a battle set with no mapping layer. Separate PvP-arena **team presets** from owned Pokémon.

**MVP impact:** Very high · **Cost to change later:** Very high

## Characters and journeys (decided Oct 2026)
Two concepts, named so one clearly belongs to the other:
- **Character:** who the player *is*. A persona with a name, a Gen-style ID number, appearance, and profile. It's the **original trainer** of every Pokémon it obtains. A user can have several characters (Red, then Gold).
- **Journey:** one character's playthrough of one region. All engine state lives here: location, progress, flags, bag, money, mode, release version, locks, revisions, and `/play` sessions. `/play` plays a journey.

Neither name assumes battling: a journey can be a trainer's gym run, a coordinator's contest circuit, or a collector's Pokédex hunt, depending on the region's progressions.

```ts
Character {
  _id; userId; serverId; name; idNo: number; createdAt;     // idNo = the Gen-style trainer ID shown on the trainer card
  visibility: 'public' | 'private' | 'inherit';              // see Privacy
  // later: appearance, roleplay profile details (post-MVP)
}

Journey {
  _id; characterId; userId; serverId; regionId; createdAt;
  status: 'active' | 'archived';                 // restart archives the old journey (Q27)
  names: Record<string, string>;                 // author-defined name slots, e.g. { rival: 'Gary' }; filled by the askName script step (07)
  releaseVersion: number;                        // see 01
  mode: { type: 'overworld' } | { type: 'script'; … } | { type: 'battle'; battleId };   // see 03
  location: { current: ContentKey; respawn: ContentKey; visited: ContentKey[] };
  // respawn = the "save point" for blackouts. Initialized to Region.defaultRespawnKey (e.g. the player's house, like RBY),
  // updated automatically when the player uses a `heal` service (Pokémon Center), or explicitly by the `setRespawn` effect.
  // Read by the engine on whiteout (RegionRules.whiteout) and by Teleport/Escape Rope-style effects. Not a condition fact.
  // Later, if needed: named anchors (Record<string, ContentKey>), with 'respawn' as the default anchor. Additive.
  away?: { regionId; location: ContentKey; returnTo: ContentKey };   // post-MVP: visiting an event region (see below)
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
  rev: number;                                    // revision / optimistic concurrency (see 03)
}
// unique index: { userId, regionId } where status = 'active' (one active journey per user per region, Q27)
```

**MVP:** one region, so each journey has its own character, created together at onboarding. The split costs nothing now, and recording the original trainer as the *character* from day one is what keeps the later modes below additive.

### Playing more than one region (post-MVP)
Two independent choices, both allowed or restricted by the **destination** region's author:
1. **Which character:** an existing one (Ash across regions, or a direct sequel) or a new one (Red, then Gold).
2. **What comes along:** nothing, limited (e.g. two Pokémon at Lv. 10 or under), or everything (a sequel built for high-level teams).

```ts
Region.entry: {
  newCharacter:      { allowed: boolean; carryOver?: CarryOverPolicy };   // Red → Gold
  existingCharacter: { allowed: boolean; carryOver: CarryOverPolicy };    // Ash, or a direct sequel
}
CarryOverPolicy = { pokemon: 'none' | 'all' | { max: number; maxLevel?: number; mustBeInDex: boolean };
                    items: 'none' | 'all' | ItemId[];  money: 'none' | 'all' | { max: number } }
```

| Example | Character | Carry-over | Original trainer on carried Pokémon | Traded-Pokémon rules? |
|---|---|---|---|---|
| Red, then Gold | New | Limited or none, from the user's other characters | Still Red | **Yes** (×1.5 EXP, obedience caps), as in the real games |
| Ash across regions | Same | Limited | Unchanged | No |
| Direct sequel | Same | Everything | Unchanged | No |

- **A Pokémon counts as traded when its original trainer isn't the character that owns it now.** That's the canon rule, and it gives the expected result in every case above.
- **Carry-over happens when the journey starts**, as an onboarding step ("Choose up to 2 Pokémon to bring along"), never mid-game.
- **Pokémon move, never copy:** ownership changes from one journey to the other in one transaction, like a trade. Copies would create duplicates and break trading and scarcity. Both journeys get an adventure log entry.
- **Compatibility is checked:** only Pokémon in the destination dex and legal under its rules are offered. Once there, they use the destination region's definitions ([12](12-content-catalog-species-moves-items.md)).
- **Progress belongs to the journey.** Badges, flags, and story progress never carry over; the character's profile shows each journey's achievements.

### Event regions and visiting (post-MVP)
Content for a server event that isn't specific to one region (e.g. every player is taken to an event island, whatever region they're in) lives in an **event region**: a region of kind `event`, owned by the server, authored, validated, and published like any region. Its content keys are its own, so identity works exactly as in [02](02-identity-and-references.md).
- **Getting there:** an active server event (`ServerState`, [04](04-progression-and-flags.md#living-region-shared-state-post-mvp-direction-oct-2026)) makes an offered or forced script appear in every eligible region, and a `visitRegion` script step sends the journey there.
- **While away:** the journey keeps its party, bag, and money. `Journey.away` records where it is and where to return, separate from `location`, so MVP code reading `location` never changes. Progress and flags earned on the island go into a per-journey record for that event region, not into the home region's flags.
- **Coming home:** by script, or automatically on the next action once the event ends (a migration rule, like a deleted location). Rewards come home with the journey.
- **Compatibility:** the event region declares fixed rules. The validator lists the eligible regions (compatible mechanics, reward species and moves allowed there), and entry checks the party's legality, like an Arena format.
- **Everyone shares one island:** shared counters, NPCs, and trainer ghosts span all regions, and limited claims default to the `user` scope, so several characters can't farm them ([04 § Claims](04-progression-and-flags.md#living-region-shared-state-post-mvp-direction-oct-2026)).

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
| **C. All instances in one collection, `storage` field** (chosen) | Uniform. Trades are an `ownerJourneyId` update. GTS and breeding pools are queries. Easy box paging. | Party read = indexed query (`ownerJourneyId, storage.kind`) or a `partyOrder` lookup. Multi-doc writes (battle results touch 6 Pokémon + the journey) want **transactions** (requires a Mongo replica set; see [15](15-persistence-caching-concurrency.md)). |

## PvP Arena teams (Pre-MVP)
Arena teams aren't owned Pokémon. They're **TeamPresets**:

```ts
TeamPreset {                     // decided Oct 2026: owned by the USER, usable across servers
  _id; userId; name;
  intendedFormat?: { serverId?: ObjectId | 'builtin'; formatId };   // UI hint only. Validated against the chosen format at challenge time.
  sets: PokemonSet[];            /* Showdown set shape; species may be canon IDs or <ns>:<slug> library IDs */
}
// Cap: 50 teams per user for now (folders later). A team using a server's library species only validates
// where that content is available. Canon-only teams work on any server with a compatible format.
```

Using the same `PokemonSet` shape means the arena's team builder, validator, and battle hookup are **reused** for adventure battles later. Allow **Showdown paste import/export** in the arena team builder. It's the fastest team-building UX possible in Discord (one modal) and the format competitive players already know.

## Privacy (decided Oct 2026)
Players can make their **profile** and/or individual **characters** private. A character's privacy covers all of its journeys.
```ts
User.privacy: { profile: 'public' | 'private' }                       // webapp profile page (account-level info, list of characters)
Character.visibility: 'public' | 'private' | 'inherit'                  // 'inherit' (default) = follow User.privacy.profile
```
- **Private** hides the profile or character, with all its journeys (party, badges, progress, battle history), from everyone except the owner and that server's staff. Staff visibility is needed for moderation and support.
- Applies to every surface: the webapp profile pages and, later, Discord lookup commands. Public Arena battles are inherently visible while they happen.
- Defaults to `public`. A "server members only" level could be added later if requested.

## Game-dev notes
- **HP/status persist** between battles (heal at Centers). The fork's HP injection (or a battle construction hook) is needed. See [14](14-battle-system-and-showdown.md).
- **EXP, levels, evolution, and move learning happen in the engine**, using DexEntry growth rates and Showdown learnsets. Evolution prompts ("What? Charmander is evolving!", cancelable) and move-replacement prompts are **script-like blocking interactions**, so reuse the mode machinery.
- **Evolution triggers (decided Oct 2026):** Gen 1 needs only level, stone, and trade (MVP). Post-MVP, an evolution can carry a `Condition` ([05](05-requirements.md)) evaluated when it would fire, e.g. "at L30 while in a location tagged `forest`". This covers Gen 4+ place-based evolutions and lets one species branch by terrain or location without new trigger types.
- **Original Trainer/ID** drives Gen 1 rules for traded Pokémon (trading is MVP, see Trading below). Traded Pokémon (original trainer ≠ the owning journey's character) gain **1.5× EXP**, and **obey only up to a badge-based level cap**: 10 with no badges, 30 with Cascade, 50 with Rainbow, 70 with Marsh, all with Earth. Both are region rules (`formulas.exp` traded bonus, `systems.obedience`).

## Decisions (Oct 2026, Q22)
- **Option C:** all owned Pokémon live in one `PokemonInstance` collection with an owner and a `storage` location. Battle results, trades, and swaps use transactions (Mongo replica set).
- **Party order** is an ordered list of ≤ 6 instance IDs on the journey (`partyOrder`). Box contents come from each instance's `storage` field.
- **Released Pokémon** are soft-deleted (`releasedAt`), kept for history and anti-abuse audits, then purged after **30 days**. The same applies to a Pokémon sent away in an in-game NPC trade (`reason: 'npcTrade'`). The permanent record is the adventure log: a `release` entry, and Pokémon stored as snapshots in every entry, so nothing in the log breaks after the purge ([22](22-adventure-log-and-narration.md)).
- **Original trainer** is recorded from day one as the **character** (character ID, name, ID number). It's needed for Gen 1's traded-Pokémon rules, and it's what lets a character carry Pokémon between regions later without them counting as traded.

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

- **Flow:** a player proposes a trade to another player in the same region. Each side picks one Pokémon privately (a prompt opened from the shared trade message, the same pattern as the Arena's private choice prompts in [14](14-battle-system-and-showdown.md#ownership)). Both confirm. **Changing an offer clears both confirmations**, so nobody is switched at the last second. Offers expire.
- **Execution is one engine action across two journeys.** `dispatch` takes both journeys' leases in a fixed order (sorted by journey ID) so concurrent trades can't deadlock, then re-checks everything against fresh state: both sides still own the offered Pokémon, neither journey is in battle or a script, and neither trade leaves a party empty. It swaps `ownerJourneyId` (and storage) in one transaction, bumps both journeys' `rev`, and updates both Pokédexes (seen/caught).
- **Where:** `RegionRules.systems.trading.access: 'pcLocation' | 'anywhere'` ([18](18-rules-time-and-randomness.md)). Gen 1 Classic uses `'pcLocation'` (the Cable Club in every Pokémon Center), checked like any action precondition ([03](03-engine-boundary-and-game-loop.md#per-journey-serialization-revisions-preconditions-and-sessions-decided-oct-2026)).
- **After the trade:** trade evolutions (Kadabra, Machoke, Graveler, Haunter) fire as the receiver's post-trade evolution prompt, the same interaction as post-battle evolution. The Gen 1 traded-Pokémon rules (EXP bonus, obedience caps) apply automatically because the original trainer differs. Both journeys get an adventure log entry (`kind: 'trade'`).
- **In-game NPC trades are also MVP**, as the `npcTrade` script step ([07](07-scripts-triggers-and-events.md)): no second player, same post-trade evolution and traded-Pokémon rules.
- **Trade evolution without trading** (e.g. a Linking Cord-style item or a level, for solo players): **post-MVP**, a configurable region rule (`RegionRules.systems.tradeEvolutions`, reserved; default: trade only).
- **Abuse limits:** same-region only, a per-user rate limit, and every trade logged. Self-trading through alt accounts can't be fully prevented, but it's visible in the logs.

## MVP scope
- Character and Journey (one character per journey in MVP), PokemonInstance (party + boxes), TeamPreset (arena), and conversion `PokemonInstance → PokemonSet + state`.
- Box UI, deposit/withdraw/release.
- Player trading (above).

## Open questions
- ~~Rival naming?~~ **Decided (Oct 2026): MVP.** Names live in **name slots** on the journey (`Journey.names`), not in progressions (progressions are for gating and tracking, not text). Any author can define a slot; Kanto Classic defines `rival`. The onboarding script fills it with the `askName` step ([07](07-scripts-triggers-and-events.md)), which offers the canon default and a confirm step. Dialogue reads it through a `{name:rival}` placeholder, and a trainer's display name can use the same placeholder.
- ~~Character profile details?~~ **Decided (Oct 2026): post-MVP.** Optional roleplay details (age, gender, a short bio) on the webapp profile, asked one at a time with a way to skip.
- ~~1 character per region? Restart?~~ **Decided (Q27):** one active journey per user per region, enforced in MVP (`charactersPerPlayer` becomes `journeysPerUser`, kept for later). Restart archives the old journey (soft delete) with a 24h cooldown. Admins can reset a player's journey.
- ~~Adventure Pokémon in the Arena?~~ **Decided (Oct 2026):** yes, in Phase 3. The Arena battles a **copy** in Showdown set shape, never the instance itself (no EXP, HP loss, or level changes carry back). The format adjusts the copy: level scaling to the format's level (Lv50 etc.) and **stat-investment overrides** (e.g. max IVs/EVs, or max DVs/Stat Exp under Gen 1 rules) so adventure Pokémon match how the format treats built teams. Format legality (species, moves, clauses) is validated as for any team.
