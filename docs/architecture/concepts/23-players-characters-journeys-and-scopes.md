# 23: Players: Characters, Journeys & Scopes

> **TL;DR:** A **user** is a Discord account. A **character** is a persona the user plays as (name, ID number, profile, privacy), and it's the original trainer of every Pokémon it obtains. A **journey** is one character's playthrough of one region, and it holds all engine state. These three levels, `user`, `character`, and `journey`, are the **scopes** every other concept uses when it asks "who does this belong to?" or "who counts as one player?".

**MVP impact:** High · **Cost to change later:** High (the original-trainer record and every journey reference depend on it)

## Why it matters
Players will want more than one playthrough. The obvious cases are restarting, playing several regions on one server, a sequel that continues your save (Ash across regions), and a new protagonist in a sequel (Red, then Gold). If engine state and identity live in one document, each of those becomes a migration. Splitting identity from the playthrough now costs nothing in the MVP and keeps every one of them additive.

The names are role-neutral on purpose. A journey can be a trainer's gym run, a coordinator's contest circuit, or a collector's Pokédex hunt, depending on the region's progressions. Nothing assumes battling, and nothing is called a "trainer", which already means NPC trainers ([11](11-npcs-trainers-and-battle-definitions.md)).

## Design (decided Oct 2026)

| Level | What it is | Holds |
|---|---|---|
| **User** | The Discord account | Account settings, profile privacy, Arena teams ([25](25-arena.md)), cross-region claims and limits |
| **Character** | A persona the user plays as. A user can have several (Red, then Gold). | Name, Gen-style ID number, appearance, profile, privacy. The **original trainer** of every Pokémon it obtains. |
| **Journey** | One character's playthrough of one region | All engine state: location, progress, flags, bag, money, party and boxes, mode, release version, revisions, `/play` sessions, locks |

```ts
Character {
  _id; userId; serverId; name; idNo: number; createdAt;     // idNo = the Gen-style ID number shown on the trainer card
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
  progress: Record<progressionKey, number | boolean | string | string[]>;   // see 04
  flags: string[];                                                          // see 04
  dex: { seen: SpeciesId[]; caught: SpeciesId[] };   // or a bitset/map. Small either way.
  partyOrder: ObjectId[];                         // ≤ 6 Pokémon instance ids (order = lead first); see 13
  boxes: { name: string; wallpaper?: string }[];  // metadata only. Membership lives on the Pokémon.
  status: { repelSteps?: number; … };
  stats: { battlesWon: number; steps?: number; playTimeSec?: number; … };
  recentExecutions: string[];                     // idempotency ring buffer (see 06)
  rev: number;                                    // revision / optimistic concurrency (see 03)
}
// unique index: { userId, regionId } where status = 'active' (one active journey per user per region, Q27)
```

**MVP:** one region, so each journey gets its own character, created together at onboarding. The only MVP-visible consequence is that Pokémon record the *character* as their original trainer from day one ([13](13-pokemon-instances-and-trading.md)).

### Rules that follow from the split
- **One active journey per user per region** (Q27). Restart archives the journey (soft delete) with a 24h cooldown. Admins can reset a player's journey. The existing `Region.charactersPerPlayer` field becomes `journeysPerUser`, kept for later.
- **Name slots live on the journey** (`Journey.names`), not in progressions, since progressions are for gating and tracking, not text. Any author can define a slot; Kanto Classic defines `rival`. The onboarding script fills it with the `askName` step ([07](07-scripts-triggers-and-events.md)), and dialogue reads it through `{name:rival}`.
- **A Pokémon counts as traded when its original trainer isn't the character whose journey owns it.** That's the canon rule, and it gives the right answer for trades, NPC trades, and every multi-region case below.
- **Content never writes to characters or users.** Effects write to the journey, region or server state, and claim records only ([06](06-effects.md#what-effects-may-write-decided-oct-2026)). Character- and user-level achievements ("completed Kanto", a badge case across regions) are derived from journeys, so archiving or deleting a region can't leave broken references in a persona.
- **Creating a character is a platform action**, not a content trigger. Regions react to `journeyStarted` ([07](07-scripts-triggers-and-events.md)), whose payload says whether the character is new and how many Pokémon were carried.

## What lives on users and characters (decided Oct 2026)
Region content can't write to users or characters, but the player, the platform, and engine bookkeeping can. This is an index of everything that lives at these levels; each row links to the concept that owns the details.

**User**

| State | Written by | When |
|---|---|---|
| Profile privacy, account settings and preferences | The player | MVP |
| Arena teams (`TeamPreset`) | The player | MVP (M1, [25](25-arena.md)) |
| Server list favorites and layout (Q19) | The player | MVP (webapp, [02](02-identity-and-references.md)) |
| Restart cooldown (24h per region), trade rate limits | Platform | MVP |
| `user`-scoped claim records (e.g. "first 100" rewards) | Engine, as part of a claim | Post-MVP ([24](24-shared-state-region-and-server.md#claims-decided-oct-2026)) |
| `user`-scoped pacing energy | Engine (action costs) | Post-MVP ([19](19-multiplayer-social-and-future-proofing.md)) |
| Moderation state (bans, the narration moderator role) | Staff | Later ([22](22-adventure-log-and-narration.md)) |

**Character**

| State | Written by | When |
|---|---|---|
| Name, ID number, privacy | The player at creation; a later rename is a player action | MVP |
| Appearance, roleplay profile details | The player | Post-MVP |
| `character`-scoped claim records (e.g. one event ribbon per persona) | Engine, as part of a claim | Post-MVP |
| `character`-scoped pacing energy | Engine (action costs) | Post-MVP |
| Achievements across journeys ("Kanto Champion", a badge case across regions) | **Derived** from journeys; may be cached, never authored | Post-MVP |

Cross-region recognition is therefore either **derived** (computed from journeys, e.g. a champion title shown in every region) or a **claim record** (written by the claim mechanism under a known key). Neither leaves region-specific data inside a persona when a region is reworked or deleted.

## Scopes (decided Oct 2026)
Whenever something needs to know "whose is this?" or "who counts as one player?", it uses one of the three levels. One definition, used everywhere:

| Scope | One unit is | Used by |
|---|---|---|
| `journey` | One playthrough | Engine state, conditions (the default scope), sessions, locks, flags, the adventure log |
| `character` | One persona, across its journeys | Original trainer, privacy, profile pages. Read-only conditions over the persona's other journeys (sequel gates, callbacks). |
| `user` | One player, across all characters and journeys | Arena teams, restart limits, trade rate limits, read-only account-level conditions (event eligibility) |

Where a choice of scope appears:

| Mechanism | Scopes | Default | Where |
|---|---|---|---|
| Condition evaluation context | `journey` (current), `character` and `user` (read-only, post-MVP) | `journey` | [05](05-requirements.md) |
| Shared-state claims (first X, limited stock) | `user`, `character`, `journey` | `user` | [24](24-shared-state-region-and-server.md#claims-decided-oct-2026) |
| Records and leaderboards (dedupe) | `user`, `character`, `journey` | `user` | [24](24-shared-state-region-and-server.md) |
| Energy / pacing (post-MVP) | `journey`, `character`, `user` | author's choice | [19](19-multiplayer-social-and-future-proofing.md) |
| Shop purchase limits (post-MVP) | `journey` now, server-wide later | — | [17](17-economy-shops-inventory.md) |

## Privacy (decided Oct 2026)
Players can make their **profile** and/or individual **characters** private. A character's privacy covers all of its journeys.
```ts
User.privacy: { profile: 'public' | 'private' }                       // webapp profile page (account-level info, list of characters)
Character.visibility: 'public' | 'private' | 'inherit'                  // 'inherit' (default) = follow User.privacy.profile
```
- **Private** hides the profile or character, with all its journeys (party, badges, progress, battle history), from everyone except the owner and that server's staff. Staff visibility is needed for moderation and support.
- Applies to every surface: the webapp profile pages and, later, Discord lookup commands. Public Arena battles are inherently visible while they happen.
- Defaults to `public`. A "server members only" level could be added later if requested.

## Playing more than one region (post-MVP)
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

- **Carry-over happens when the journey starts**, as an onboarding step ("Choose up to 2 Pokémon to bring along"), never mid-game.
- **Pokémon move, never copy:** ownership changes from one journey to the other in one transaction, like a trade. Copies would create duplicates and break trading and scarcity. Both journeys get an adventure log entry.
- **Compatibility is checked:** only Pokémon in the destination dex and legal under its rules are offered. Once there, they use the destination region's definitions ([12](12-content-catalog-species-moves-items.md)).
- **Progress belongs to the journey.** Badges, flags, and story progress never carry over. A sequel can *read* the persona's earlier journeys through `character`-scope conditions ("you sided with Team X in Kanto"), and the character's profile shows each journey's achievements.
- **Eligibility gates** (e.g. "an existing character must have completed Kanto Classic") are conditions on `Region.entry`, evaluated in the `character` and `user` scopes.

## Event regions and visiting (post-MVP)
Content for a server event that isn't specific to one region (e.g. every player is taken to an event island, whatever region they're in) lives in an **event region**: a region of kind `event`, owned by the server, authored, validated, and published like any region. Its content keys are its own, so identity works exactly as in [02](02-identity-and-references.md#event-regions-post-mvp).
- **Getting there:** an active server event ([24](24-shared-state-region-and-server.md)) makes an offered or forced script appear in every eligible region, and a `visitRegion` script step sends the journey there.
- **While away:** the journey keeps its party, bag, and money. `Journey.away` records where it is and where to return, separate from `location`, so MVP code reading `location` never changes. Progress and flags earned on the island go into a per-journey record for that event region, not into the home region's flags.
- **Coming home:** by script, or automatically on the next action once the event ends (a migration rule, like a deleted location). Rewards come home with the journey.
- **Compatibility:** the event region declares fixed rules. The validator lists the eligible regions (compatible mechanics, reward species and moves allowed there), and entry checks the party's legality, like an Arena format ([25](25-arena.md)).
- **Everyone shares one island:** shared counters, NPCs, and trainer ghosts span all regions, and limited claims default to the `user` scope, so several characters can't farm them.

## MVP scope
- `Character` and `Journey` models, one character per journey, created together at onboarding (with an `idNo`).
- One active journey per user per region; restart (archive, 24h cooldown) and admin reset.
- Name slots and the `askName` step; privacy settings for profile and characters.
- The `journey` condition scope; `character` and `user` reserved.
- Not MVP: `Region.entry`, carry-over, choosing an existing character, event regions, profile roleplay details.

## Open questions
- ~~Rival naming?~~ **Decided (Oct 2026): MVP**, via journey name slots (see Rules above).
- ~~Character profile details?~~ **Decided (Oct 2026): post-MVP.** Optional roleplay details (age, gender, a short bio) on the webapp profile, asked one at a time with a way to skip.
- ~~1 character per region? Restart?~~ **Decided (Q27):** one active journey per user per region (see Rules above).
