# 11: NPCs, Trainers & Battle Definitions

> **TL;DR:** Split **who is standing here** (NPC: name, sprite, location, talk script) from **how they battle** (Trainer: class, ordered conditioned party variants, AI profile, reward formula, format). An NPC may reference a trainer. Defeat state is an engine flag. Gym leaders, rivals, and Elite 4 members are trainers with richer scripts, not special types.

**MVP impact:** High · **Cost to change later:** Medium

## Current shape
`Location.trainerIds` (refs a non-existent `Trainer`). The chat agreed the rival is a Trainer with multiple teams. Your roadmap adds talkable and/or battleable NPCs, on-defeat effects, gym-leader-tier config, and party variants keyed off progressions.

## Proposed shape
```ts
TrainerClass {                  // region registry, canon defaults seeded (Youngster, Bug Catcher, Gym Leader…)
  id; name; baseMoney;          // payout = baseMoney × level of last Pokémon (Gen 1–4 formula; rules may override)
  spriteUrl?; defaultAi: AiProfileId; music?/emoji?
}

Trainer {
  key; regionId; name; class: TrainerClassId; spriteUrl?;
  format: 'singles' | 'doubles';
  parties: {                    // ordered: first variant whose condition passes is used
    condition?: Condition;      // e.g. choice starterChoice in ['bulbasaur'] ∧ milestone badges ≥ 3
    pokemon: TrainerPokemon[];  // species, level, moves? (default: last 4 level-up moves), ability?, item?, nature?, ivs/evs?
    items?: { item: ItemId; count: number }[];   // trainer bag (Full Restores)
  }[];
  ai: AiProfileId;              // 'random' | 'basic' | 'smart' | 'gym' | 'champion' (see 14)
  rewards?: { money?: number | 'formula'; effects?: Effect[] };
  rematch?: { condition: Condition; parties: … }; // later
  defeatFlag: auto;             // engine writes trainer:<key>:defeated
}

Npc {
  key; regionId; location: ContentKey; name; spriteUrl?; ordinal;
  visibleWhen?: Condition;      // Team Rocket grunts disappear after the hideout is cleared
  trainer?: ContentKey;         // battleable
  interact?: ContentKey;        // talk trigger/script (gym leader dialogue, item gifts)
  engagement?: 'onTalk' | 'onEnter' | 'onExplore';   // how trainer battles start (see game-dev note)
}
```

### Party variants
This covers rival teams keyed off `starterChoice`, story-stage milestones, and post-game rematches *with one evaluator* (conditions). The validator warns if no variant matches for some reachable state (e.g. you forgot the Squirtle branch). That's a strong soft-lock check.

### Game-dev: how do trainers engage in a text game?
In the games, line of sight forces battles. Options:
- `onEnter`: entering the location triggers each undefeated trainer (punishing, very authentic).
- `onExplore`: each "Explore" may surface an undefeated trainer instead of a wild Pokémon (organic, recommended default for routes).
- `onTalk`: optional battles (gym trainers you can skip, like in some games).
- **Route clearance:** optional rule that the exit edge stays locked until all `blocking` trainers are defeated.

## Options

| Option | Pros | Cons |
|---|---|---|
| A. Trainer only (talk text embedded in trainer) | Fewer models | Non-battling NPCs (Oak, nurse, item givers) don't fit. Dialogue gets duplicated. |
| **B. NPC + Trainer split** (recommended) | Talkers, battlers, and both. Trainers are reusable (rival appears in 7 places with one definition). | Two builder screens (templates hide this: "Add Trainer NPC") |
| C. BattleDefinition as its own model (floated) | Reuse battle configs | Scripts' `battle` step already carries per-encounter config (canLose, healAfter). Not needed. |

## Gym leaders, Elite 4, rivals
- Gym leader = Trainer (class Gym Leader, smart AI, badge/TM rewards via script) + NPC in the Gym node + "Gym Leader" script template.
- Elite 4 = gauntlet script (see [07](07-scripts-triggers-and-events.md)).
- Rival = one Trainer with variants. Encounters are triggers in several locations.

## Decisions (Oct 2026, Q4)

**Engagement modes** are set per trainer NPC: `onExplore` (default for route trainers), `onEnter`, `onTalk`.

**Every trainer battle in a location counts toward its traversal costs**, however it started (explore, entry, talk, or a script). Location progress counters are fed by "trainer defeated *here*" events, not by engagement mode. Named trainers in `traversal.firstPass.trainers` count whenever they're beaten.

**Several `onEnter` trainers = back-to-back battles, i.e. a gauntlet.** Entering a location with undefeated `onEnter` trainers runs them **in sequence** (by NPC ordinal), with no healing between. A loss whites you out as usual, and trainers already beaten stay beaten. Under the hood this is the same thing as an authored gauntlet: the engine generates an entry-trigger script of consecutive `battle` steps. Authors who want more control (dialogue between battles, different loss rules) write the gauntlet explicitly as a script.

**Gauntlets** (already covered in [07](07-scripts-triggers-and-events.md)) are scripts made of consecutive `battle` steps with no `heal` between. The **Gauntlet template** (used for the Elite 4) adds two options:
- `resetOnLoss`: E4-style. A loss clears progress, so the whole gauntlet restarts from the first battle next time.
- `lockedUntilComplete`: exits are gated until the gauntlet is finished, or the player whites out.

**After defeat: customizable per trainer.**
```ts
Npc.afterDefeat?: {
  visible: boolean;            // stay in "People here" (default true) or disappear
  interact?: ContentKey;       // post-battle talk script ("You're too strong!"); omit = no dialogue
}
```

**Gym leader availability: customizable, via a Gate on the NPC.** NPC interaction already takes a `Gate` ([05](05-requirements.md)), so "the leader only appears after N gym trainers are beaten" is a gate condition on the leader:
- `presentation: 'hidden'`: the leader isn't listed until the condition passes.
- `presentation: 'locked'`: listed but disabled ("Defeat 2 more trainers to challenge Brock").
- `presentation: 'attemptable'`: talking runs a "Not so fast!" script.

The condition uses a new MVP fact, `location.trainersDefeated` (distinct trainers defeated here), or specific trainer flags. The **Gym Leader template** exposes this as an option ("Require N gym trainers first", off by default) and generates the gate.

## MVP scope
- TrainerClass registry (canon seed), Trainer with conditioned parties, Npc with location/visibility/interact/trainer, engagement modes (`onTalk`, `onExplore`, `onEnter`), payout formula, defeat flags, and templates (Route Trainer, Gym Leader, Rival).
- Later: rematches (VS Seeker / Gen 2 phone), double battles with two trainers, multi-battles (tag partners).

## Open questions
- ~~Default trainer movesets?~~ **Decided (Oct 2026):** yes. A trainer Pokémon with no moves set gets the last 4 moves it would know at its level from the region's learnsets (Gen 1 for Kanto Classic), as RBY does. Moves the author sets always win.
- ~~Trainer bag items in MVP AI?~~ **Decided (Oct 2026):** yes, kept minimal. A trainer party's `items` list is used by every AI profile except `random`: heal when the active Pokémon's HP is low, or cure a status the item cures. It goes through the same external choice hook as the player's bag (see [14](14-battle-system-and-showdown.md#ai-trainers)). Gen 1 gym leaders and the Elite Four use items, so Kanto Classic needs it.
