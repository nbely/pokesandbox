# M1: Battle Core & Catalog (backlog draft, partial)

Drafted so far: the **moves and learnsets catalog** epic (E-M1-2), which can start now and run in parallel with M0a. The rest of M1 (fork modernization, BattleService, items, rules, teams, AI) is drafted later; E-M1-1 is reserved for the fork modernization epic.

Refs: concept [12](../architecture/concepts/12-content-catalog-species-moves-items.md), [`mvp.md` § M1](../roadmap/mvp.md#m1-battle-core--catalog)

## E-M1-2 · Catalog: Moves & Learnsets
`Type: Epic` · `Priority: P0`

Import every canon move and learnset from a pinned Showdown version into the DB catalog, with per-generation data, so authoring, display, validation, and TM/HM lists ([E-M3-1](m3-region-authoring.md)) can read them. Showdown stays the battle engine; the catalog holds data only ([12 § Moves](../architecture/concepts/12-content-catalog-species-moves-items.md#moves-import-overrides-and-showdown-callbacks-decided-oct-2026)).

### Start here (no prior context needed)

**What you're building, in Pokémon terms.** PokeSandbox lets Discord servers build their own Pokémon regions (Kanto remakes, fan regions) and play them in Discord. Regions can follow any generation's rules piece by piece, so the app needs every canon move and every species' learnset **for every generation**: Gen 1 Bite is Normal-type with a 10% flinch, Gen 2+ Bite is Dark; Gen 1 Pikachu learns Thunderbolt by TM, and so on. This epic imports that data into our MongoDB so the rest of the app can read it. Then E-M3-1 lets each region define its own TM/HM case (Gen 1's TM24 is Thunderbolt; other generations number differently).

**Where things live in this repo**
| What | Where | Copy the pattern from |
|---|---|---|
| Models (Zod + Mongoose) | `shared/src/models/` (export new ones from `index.ts`) | `dexentry.model.ts`; `region/region.model.ts` for `zMapHydrator` (in `models/utils.ts`) |
| DTOs (read shapes for the bot/webapp) | `shared/src/dtos/` | `region.dto.ts` |
| Seed data and loader | `scripts/seed/data/*.json`, registered in `scripts/seed/collections.ts` (`collectionSeedMap`) | the `dexentries` entry |
| Pokédex builder menus (for M1-04) | `apps/bot/src/interactions/guilds/<dev guild>/slashCommands/regionManagement/pokedex/` | `managePokedex.ts`, `pokedex.embeds.ts` |
| Design decisions | `docs/architecture/concepts/12-content-catalog-species-moves-items.md` | sections "Moves" and "Learnsets" |

Local setup: `npm run setup` (env file, Mongo in Docker, seed), then `npm run db:seed` after changing seed data. Tests run with Jest through Nx (e.g. `npx nx test shared`). One PR per issue; every PR is reviewed by the owner.

**Pokémon Showdown in five minutes**
- Showdown is the open-source battle simulator behind play.pokemonshowdown.com. It has complete, maintained data for every generation, which is why we import from it. It also runs our battles later, but this epic only reads its data.
- It's on npm as `pokemon-showdown`. Install an exact version as a dev dependency for the import scripts (e.g. `npm i -D pokemon-showdown@<exact version>`), and record that version on every imported record.
- **IDs:** everything is keyed by an ID: lowercase, alphanumeric only. `toID('Thunder Bolt') === 'thunderbolt'`, `toID('Mr. Mime') === 'mrmime'`. Ours use the same IDs (`moveId`, `speciesId`).
- **Per-generation data:** each older generation is a "mod" (`data/mods/gen1` … `gen8`) that only stores what differs from the next generation up, with base `data/` being Gen 9. **You never need to read those files.** Ask the API for a generation and it hands you fully resolved data:
  ```ts
  import { Dex, toID } from 'pokemon-showdown';

  const gen1 = Dex.mod('gen1');                 // Dex.mod('gen2') … Dex.mod('gen8'); plain `Dex` is Gen 9
  const bite = gen1.moves.get('bite');
  bite.type;          // 'Normal' in Gen 1 (Dex.moves.get('bite').type is 'Dark')
  bite.category;      // per-gen correct (pre-Gen 4 categories come from type)
  bite.shortDesc;     // the description text for that generation
  bite.isNonstandard; // null when the move exists in this gen; 'Past' (removed) / 'Future' (not yet) / 'CAP' (fan-made: skip)

  gen1.moves.all();                              // every move as that generation sees it
  gen1.data.Moves['bite'];                       // the raw resolved entry: plain data plus any callback functions
  ```
- **Callbacks:** some moves have functions in their data (`basePowerCallback`, `onHit`, `onModifyType`, …). Those are battle behavior. We **don't** copy them, only record their names (the `hooks` field), e.g. from `Object.keys(entry).filter(k => typeof entry[k] === 'function')`.
- **Learnsets:** `dex.species.getLearnsetData(speciesId).learnset` (the API name in 0.11.x; check the pinned version) gives `moveId → source codes`, e.g. `thunderbolt: ['9M', '8M', …, '1M']`. The code is `<gen><method><detail>`: `L15` level 15, `M` TM/HM, `T` tutor, `E` egg, `S0` event, `V` Virtual Console. So `1L15` = learned at level 15 in Gen 1.
- **Learnset gotchas:**
  - Some forms have no learnset of their own and share their base species' (Showdown marks the link with `changesFrom` / `baseSpecies`). Store the base species' learnset under the form's ID, or record the fallback, so no form ends up with an empty move list.
  - A species' learnset doesn't include moves only its pre-evolution learns. That's correct for display (it matches the games' level-up lists), so don't merge them.
  - Gen 1 and Gen 2 learnsets live in the same data with `1…` and `2…` codes, so filter by the leading digit.

**Words used in these issues**
- **Catalog:** global, canon game data shared by every region (species, moves, learnsets, items).
- **`GenId`:** `'gen1'` … `'gen9'`.
- **`ResolvedLearnset`:** a learnset already filtered to one generation and grouped by method (`levelUp`, `machine`, `tutor`, `egg`, `event`). Everything outside the catalog reads this, never raw codes.
- **Region content:** things a region's admins author (locations, NPCs, its TM/HM list). It's published as versioned releases. You only touch it in E-M3-1.

**Notes for whoever picks this up**
- **Where models live for now:** `shared/src/models`, next to `DexEntry`. They move to `libs/core` when M0A-09 lands; keep them free of Discord and bot imports so the move is mechanical.
- **Model conventions:** the Zod schema is the source of truth (`moveDefinitionSchema`), mirrored by the Mongoose schema (`moveDefinitionDbSchema`). Embedded sub-schemas are standalone `Schema` consts with `{ _id: false }`. Map fields are parsed with `zMapHydrator`.
- **Which Showdown:** until the fork is published as a package (fork modernization epic), import from the upstream `pokemon-showdown` npm package at an exact pinned version, as a dev dependency of the import script. Record the version on every imported record.
- **IDs:** moves and species are keyed by Showdown IDs (`toID`), never ObjectIds. Species use the same string `DexEntry.showdownName` holds today; M0A-19 renames that field to `speciesId`.

**Changes once foundations land.** This epic starts before the foundations it will eventually sit on, so some issues get small follow-ups. Each one is also listed on the foundation issue that triggers it, so it isn't lost:

| When this lands | Follow-up | Affects |
|---|---|---|
| `libs/core` (M0A-09) + module boundaries (M0A-10) | Move the catalog models and helpers from `shared/` into `libs/core`. Mechanical if they stay free of Discord/bot imports. | M1-01, M1-03 (and M3-01) |
| The fork is published as a package (M1 fork modernization) | Point the import scripts at the fork package instead of upstream `pokemon-showdown`, re-run, and review the diff. | M1-02, M1-03 |
| The `speciesId` rename (M0A-19) | Learnsets already use `speciesId`; the orphan test switches from `DexEntry.showdownName` to `DexEntry.speciesId`. | M1-03 |
| `RegionRules` (M1) | Replace the "default Gen 1" generation choice with the region's `rules.data.moves` / `rules.data.learnsets`. | M1-04 |
| Pokédex builder on authoring commands (M0B-17) | The move views stay read-only (no authoring commands needed), but they live in the same menus M0B-17 restructures. Whichever lands second rebases onto the other. | M1-04 |

### M1-01 · `MoveDefinition` model
`Type: Task` · `Parent: E-M1-2` · `Priority: P0` · `Size: S` · `Labels: area:shared-models, domain:catalog` · `Blocked by: —` · `agent-ready: yes` · `Owner: any`

**Summary:** The catalog model for moves ([12 § Moves](../architecture/concepts/12-content-catalog-species-moves-items.md#moves-import-overrides-and-showdown-callbacks-decided-oct-2026)): a resolved Gen 9 `base`, per-gen `genOverrides` holding only differences, and per-gen behavior `hooks`. Text and availability are ordinary `MoveData` fields, so they vary by generation the same way.

```ts
MoveDefinition {
  moveId: MoveId;                 // unique; Showdown toID
  num: number; name: string;
  introducedGen: number;          // Showdown's `gen` field
  base: MoveData;                 // the resolved Gen 9 record (base Dex)
  genOverrides: Partial<Record<GenId, Partial<MoveData>>>;   // per resolved gen Dex, only the fields that differ from `base`
  hooks: Partial<Record<GenId, string[]>>;                    // names of behavior callbacks (basePowerCallback, onHit, …); no code
  source: { showdownVersion: string };
}

MoveData = {
  // Data fields from data/moves.ts: only the fields Showdown actually has, all plain data
  type; category: 'Physical' | 'Special' | 'Status'; basePower; accuracy: number | true;
  pp; priority; target; flags; secondary?; secondaries?; critRatio?; multihit?; recoil?; drain?; …;
  isNonstandard?: string | null;  // null = available; 'Past' (removed in that gen), 'Future', … Per gen via genOverrides.
                                  // Moves that are 'CAP' (fan-made) in every gen aren't imported at all.
  // Text fields spread from data/text/moves.ts, under Showdown's own names
  desc: string; shortDesc: string;
}
```
- **Text sits in `MoveData`**, so Showdown's per-generation text blocks (`gen1: { desc, shortDesc }`) land in `genOverrides` like any other changed field, and `resolveMove(def, gen)` returns the right description with no special case. The resolved Dex already applies Showdown's fallback (a generation without its own block uses the nearest older-generation block above it, then the current text).
- **Availability is `isNonstandard`**, so it's per generation through `genOverrides` too, with no separate map.
- **Battle message templates** in the same text file (`start`, `activate`, `end`, `damage`, …) aren't stored. The battle renderer reads them from Showdown at runtime ([26](../architecture/concepts/26-discord-surface-and-ux-patterns.md#battles)); custom moves (post-MVP) inherit their template move's messages.

**Acceptance criteria**
- `moveDefinitionSchema` (Zod) and `moveDefinitionDbSchema` (Mongoose) following the model conventions above, matching the shape above. `GenId` is `'gen1' | … | 'gen9'`.
- `MoveData` covers every plain-data field Showdown has for moves (the list above is the common ones; include any other non-function field present in the source), plus `desc` and `shortDesc`. No functions.
- A helper `resolveMove(def, gen) → MoveData` that applies `genOverrides[gen]` over `base`, with unit tests.
- Unique index on `moveId`. A DTO for the read path.

**Changes later:** moves to `libs/core` with M0A-09/M0A-10.

**Refs:** [12](../architecture/concepts/12-content-catalog-species-moves-items.md)

### M1-02 · Import moves from Showdown
`Type: Task` · `Parent: E-M1-2` · `Priority: P0` · `Size: M` · `Labels: area:shared-models, domain:catalog` · `Blocked by: M1-01` · `agent-ready: yes` · `Owner: any`

**Summary:** A re-runnable script that builds `MoveDefinition` seed data from the pinned Showdown version, using Showdown's own resolved Dex per generation, never by parsing its data files.

**Acceptance criteria**
- For each generation 1–9, load the resolved Dex (`Dex.mod('gen1')` … `Dex.mod('gen8')`, base for Gen 9) so the inheritance merge and `scripts.ts` `init()` are applied. Main-series mods only; side mods (`gen1stadium`, `gen7letsgo`, `gen8bdsp`, …) are skipped.
- `base` = the resolved Gen 9 record; `genOverrides[gen]` = only the fields that differ from `base`. Functions are dropped; their names go into `hooks[gen]`.
- `isNonstandard` is imported as a data field, so per-gen availability (`Past`, `Future`) lands in `genOverrides`. Moves that are `'CAP'` in every generation aren't imported.
- `desc` / `shortDesc` come from each generation's resolved move (`dex.moves.get(id).desc`), which already applies Showdown's per-gen text fallback from `data/text/moves.ts`; differences from Gen 9 go into `genOverrides` like any other field. Battle message templates (`start`, `activate`, …) aren't stored.
- Output is deterministic (sorted keys) and written to `scripts/seed/data/moves.json`, so a re-import is a readable diff. Register it in `scripts/seed/collections.ts` so `npm run db:seed` loads it. The script lives under `scripts/` with a `package.json` script entry (e.g. `catalog:import`).
- Tests against the generated data (worth verifying each against the source when writing them):
  - Bite: Normal type and 10% flinch in Gen 1; Dark from Gen 2.
  - Gust: Normal in Gen 1.
  - Shadow Ball: Physical in Gen 3 (Ghost was a physical type before Gen 4); Crunch: Special in Gen 3.
  - Low Kick has `basePowerCallback` in its hooks for the generations where its power is weight-based.
  - A move removed from Gen 8+ games is `Past` there and available in earlier generations.
  - Bite's Gen 1 `shortDesc` override is the 10% flinch text, and its Gen 9 `desc` is the 30% one.

**Changes later:** re-point to the fork package once it's published, then re-run and review the diff.

**Refs:** [12 § Moves](../architecture/concepts/12-content-catalog-species-moves-items.md#moves-import-overrides-and-showdown-callbacks-decided-oct-2026)

### M1-03 · `Learnset` model and import
`Type: Task` · `Parent: E-M1-2` · `Priority: P0` · `Size: M` · `Labels: area:shared-models, domain:catalog` · `Blocked by: M1-02 (reuses its import setup)` · `agent-ready: yes` · `Owner: any`

**Summary:** One document per species with Showdown's per-generation source codes, so a region on Gen 1 learnsets filters to `1*` sources (`1L15` = level 15 in Gen 1, `1M` = TM/HM in Gen 1).

**Acceptance criteria**
- `Learnset { speciesId; moves: Record<MoveId, string[]>; source: { showdownVersion } }` with the model conventions above; unique index on `speciesId`.
- Imported through the Showdown API per generation, like M1-02 (`Dex.mod('genN').species.getLearnsetData(id)`; the API already merges old-generation learnset data, so no raw files are read). Forms without their own learnset get their base species' (see the gotchas in Start here). Deterministic output to `scripts/seed/data/learnsets.json`, registered in `scripts/seed/collections.ts`.
- `resolveLearnset(learnset, gen) → ResolvedLearnset` (`levelUp` sorted by level, `machine`, `tutor`, `egg`, `event`), the shape every consumer uses ([12 § Learnsets](../architecture/concepts/12-content-catalog-species-moves-items.md#learnsets--generation-decided-oct-2026)). Nothing outside the catalog reads raw source codes. Override patches are post-MVP, but the resolved shape is what they'll patch.
- Every species ID matches an existing `DexEntry` (a test fails on orphans). Coordinate with M0A-19 if it lands at the same time.
- Tests (verify each against the source): Pikachu's Gen 1 resolved learnset has Thunderbolt in `machine`; Bulbasaur's Gen 1 `levelUp` includes Vine Whip; a move that only exists from Gen 2 never appears in Gen 1 results.

**Changes later:** moves to `libs/core` (M0A-09/M0A-10); re-point to the fork package; the orphan test follows the M0A-19 rename.

**Refs:** [12 § Learnsets](../architecture/concepts/12-content-catalog-species-moves-items.md#learnsets--generation-decided-oct-2026)

### M1-04 · Move details in the Pokédex builder (read-only)
`Type: Feature` · `Parent: E-M1-2` · `Priority: P1` · `Size: M` · `Labels: area:bot, domain:catalog` · `Blocked by: M1-02, M1-03` · `agent-ready: yes` · `Owner: junior`

**Summary:** Let admins (and later players) see a Pokémon's moves and each move's details for a chosen generation, from the catalog.

**Acceptance criteria**
- From a Pokédex entry in the builder: a paginated move list for a chosen generation (default: Gen 1 until regions have rules), grouped by method (level-up with levels, TM/HM, other).
- Reads the species' `ResolvedLearnset` for the chosen generation.
- Selecting a move shows its details for that generation: type, category, power, accuracy, PP, priority, and the short description (the generation's text block when there is one).
- Reads through a small catalog read service (`getMove(moveId, gen)`, `getLearnset(speciesId, gen)`) in `shared/`, not direct queries from the menu.
- Locked or unavailable options follow [26 § Menus and feedback](../architecture/concepts/26-discord-surface-and-ux-patterns.md#menus-and-feedback).

**Changes later:** the generation comes from `RegionRules` once it exists; rebase alongside M0B-17's Pokédex builder migration.

**Refs:** [12](../architecture/concepts/12-content-catalog-species-moves-items.md), [26](../architecture/concepts/26-discord-surface-and-ux-patterns.md)
