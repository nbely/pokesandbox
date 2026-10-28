# 07: Scripts, Triggers & Events (the Interaction Engine)

> **TL;DR:** Your MVP list includes conditional triggers, NPC talk/defeat interactions, dialogue, forced battles, pick-1 gifts, battle gauntlets, rival encounters, gym leaders, and guided onboarding. All of these are **the same primitive**: *when X happens, if conditions hold, run an ordered sequence of dialogue / choices / battles / effects, possibly waiting for the player in between.* Build one small, data-driven **Script** system (a step VM with persisted cursors) and express every one of those features as content. Quest Engine v2 (active quests, tutorials, loaner Pokémon, quiz stages, RP-hurdle stages) then becomes *more step types plus a quest log*, not a rebuild.

**MVP impact:** Very high · **Cost to change later:** Very high (this is the rebuild risk you asked about)

## Why this is the most important recommendation

Look at how real Pokémon games are built. In the pret decompilations (`pokered`, `pokeemerald`), almost every story beat is a **map script**: a list of commands (`msgbox`, `trainerbattle`, `checkflag`, `goto_if_set`, `giveitem`, `setflag`, `applymovement`) attached to an NPC, a tile trigger, or map entry. Gym leaders, rivals, starters, the Elite 4, gift Pokémon, and Snorlax are all scripts. The engine supplies a few dozen commands, and the game is content.

The ChatGPT plan models these as separate features:

| Feature | ChatGPT direction | Runtime it implies |
|---|---|---|
| Location entry effects | `location.entryEffects` | entry executor |
| NPC dialogue | NPC + DialogueTree (floated) | dialogue runner |
| Forced battles / triggers | Trigger model with requirements + effects | trigger runner |
| Rival battles | quest references Trainer ID | quest runner |
| Pick-1 gifts | (roadmap) dedicated bundle model | gift selector |
| Elite 4 gauntlet | BattleDefinition (floated) | gauntlet runner |
| Onboarding / tutorial | (roadmap) active quest | quest runner |

That's 5–7 runtimes, each with its own persistence ("where was the player when the bot restarted?"), its own builder UI, and its own bugs. Quest v2 then needs to compose them ("battle, then dialogue, then a choice, then a gauntlet"), which is where a rebuild happens.

## Proposed model

```ts
// Content (in the region release)
Script {
  key: ContentKey;
  name: string;
  steps: Step[];               // or a labeled list for gotos
}

Trigger {
  key: ContentKey;
  on:                          // the event that can start it
    | { event: 'enterLocation'; location: ContentKey }
    | { event: 'interact'; npc: ContentKey }             // "Talk"
    | { event: 'battleEnd'; trainer: ContentKey; result: 'win' | 'lose' }
    | { event: 'characterCreated' }                      // onboarding
    | { event: 'useItem'; item: ItemId; location?: ContentKey }
    | { event: 'explore'; location: ContentKey }         // e.g. Snorlax blocks Route 12
    | { event: 'gateBlocked'; gate: GateOwnerRef }       // player attempted an 'attemptable' gate and failed (see 05 §4)
  condition?: Condition;       // e.g. not flag script:rival-r22:done, milestone badges≥…
  once: boolean;               // engine writes flag script:<key>:done
  priority: number;            // multiple matches → highest wins
  mode: 'forced' | 'offered';  // forced = runs immediately; offered = shows a button ("Talk to Oak")
  script: ContentKey;
}

type Step =
  | { say: { speaker?: SpeakerRef; text: string } }                   // waits for "Next"
  | { choice: { prompt: string; options: { label: string; condition?: Condition; goto: Label }[] } }
  | { battle: { trainer: ContentKey; party?: 'auto' | string; canLose?: boolean;
                healAfter?: boolean; onWin?: Label; onLose?: Label } }
  | { wildBattle: { spec: PokemonSpec; canRun?: boolean; onCatch?: Label; onDefeat?: Label; onRun?: Label } }
  | { effects: Effect[] }
  | { if: { condition: Condition; then: Label; else?: Label } }
  | { shop: ContentKey } | { heal: {} } | { travel: LocationRef }
  | { label: Label } | { goto: Label } | { end: {} };
```

**Runtime:** the script VM runs steps until a **blocking** step (`say`, `choice`, `battle`, `shop`). It then persists `character.mode = { type: 'script', script, releaseVersion, pc, locals, startedAt }` and emits events for the bot to render. Player input resumes it. Battles return a result to the VM. Bot restarts are harmless.

### How each MVP feature maps

| Roadmap feature | As content |
|---|---|
| Pick-1 starter | `characterCreated` trigger (forced) → `say` (Oak) → `choice` (3 options) → each branch: `effects[givePokemon, choice starterChoice=x]` |
| Rival setup + party variants | Trainer `rival` with parties conditioned on `choice starterChoice` and story flags (see [11](11-npcs-trainers-and-battle-definitions.md)). `battle: { trainer: rival }` picks the variant automatically. |
| Forced rival battle on Route 22 | `enterLocation route-22` trigger, `once`, condition `not flag …` → `say` → `battle canLose: true` → `say` |
| Gym leader | NPC Brock → `interact` trigger → `say` → `battle` → `onWin: effects[milestone boulder, item tm34, flag]` → `say` (TM explanation). Gym-leader tier is just the trainer's AI profile plus rewards. |
| Elite 4 gauntlet | One script: `battle lorelei healAfter:false` → `battle bruno` → … `onLose: whiteout`. "No healing between" is the absence of a `heal` step. |
| Fossils / Eevee | Same as starters, with a different trigger |
| Conditional dialogue | `if` / conditioned `choice` options |
| Snorlax / legendary static encounter | `explore` trigger → `wildBattle` → `onDefeat`/`onCatch` → `effects[flag]` |
| Tutorial (Full roadmap) | Narrator `say` steps (speaker = narrator), the same machinery |
| Quest v2 active quests | A script with a quest-log entry plus more step types (`loanPokemon`, `quiz`, `rpHurdle`) |
| Quest v2 passive quests | Objective listeners on engine events (`pokemonCaught`, `battleWon`, `itemsChanged`) → completion runs a script |

## Options

| Option | Pros | Cons |
|---|---|---|
| A. Bespoke features (current trajectory) | Each builder UI is simple and specific | 5–7 runtimes and persistence models. Composition is impossible. Quest v2 rebuild. |
| **B. Step-based Script VM + Triggers** (recommended) | One runtime, one persistence model, one test harness. Every MVP feature is content. Unlimited composition. Mirrors proven Pokémon engine design. | The builder needs a "script editor" (step list). Discord's UI is cramped for long scripts. |
| C. Node-graph dialogue system (Ink/Yarn-like) | Great for branching narrative | Heavier to author in Discord. Battles and effects become awkward custom nodes. |
| D. Embedded scripting language (Lua/JS sandbox) | Ultimate power | Security, sandboxing, and support burden. Admins aren't programmers. Fails the "no coding required" promise. |

### Mitigating the authoring cost of option B
1. **Templates** generate whole scripts from forms: "Gym Leader" (name, party, badge, TM, intro/defeat text), "Starter Gift" (N options), "Forced Rival Encounter", "Item Gift NPC", "Gauntlet". Most admins never see a raw step list, so the friendly builder UIs from option A survive *as templates over B*.
2. A **step-list editor** in Discord for small edits: add/remove/reorder steps, edit a step via modal.
3. **JSON/YAML import** for power users, and later a **webapp visual editor**. Consider pulling a basic webapp script editor into MVP if Discord editing proves painful.

## Guardrails
- No arbitrary loops without a blocking step (the VM caps steps per dispatch to prevent infinite `goto`).
- Scripts can't call scripts recursively in MVP (add `call` later with a depth limit).
- The validator checks that labels exist, referenced trainers/NPCs/items exist, and there's no unreachable `end`. It also warns if a `battle canLose:false` has no `onLose` (whiteout default).

## MVP scope
- Trigger events: `characterCreated`, `enterLocation`, `interact`, `battleEnd`, `explore`.
- Steps: `say`, `choice`, `if`, `effects`, `battle`, `wildBattle`, `heal`, `shop`, `travel`, `goto/label/end`.
- Templates: Gym Leader, Starter/Pick-N Gift, Forced Encounter, Gift NPC, Gauntlet, Simple Talker.

## Decisions (Oct 2026)

Option B was adopted: one Script + Trigger system, **on the condition that building scripts stays easy for users**.

1. **NPC interaction:** a "People here" list, where each NPC has a talk (interact) trigger. Leaning this way; it can be cemented later. Underneath it's the same trigger either way, so this is a UI decision only.
2. **Presentation:** MVP renders plain paged dialogue. Rich presentation comes later (custom embeds, **Discord Components v2** layouts: containers, sections with portrait/sprite thumbnails, media galleries). **Design for it now:** `say` (and `choice`) steps keep content separate from presentation:
   ```ts
   { say: { speaker?: SpeakerRef; text: string; presentation?: { style?: PresentationStyleId; portraitUrl?; imageUrl?; accentColor? } } }
   ```
   The MVP renderer ignores `presentation`. Later renderers use it, plus region-level dialogue themes, without migrating scripts.
3. **Discord-complete authoring (principle, applies to every builder feature, not just scripts):** everything must be editable in Discord, even where it's less friendly than the webapp. Some creators will never leave Discord. The webapp is an *additional* client of the same `libs/authoring` commands, never the only place a feature can be edited. For scripts this means a Discord **step-list editor** (list steps, add/insert/move/delete, edit a step via modal, pick step types from select menus), on top of templates. It leans on Components v2 where it helps: sections with per-step edit accessories, separators between labels, and text displays for long dialogue previews.
4. **Guardrails:** confirmed. No script-calls-script in MVP (add `call` later with a depth limit), and a step cap per dispatch so a bad `goto` can't loop forever.

## Open questions
- ~~Offered triggers vs People here?~~ See Decision 1.
- ~~Cutscene presentation?~~ See Decision 2.
- Should scripts support **timed waits** ("come back tomorrow") in MVP? That needs a `timer` progression kind.
