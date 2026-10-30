# M1: Battle Core & Catalog (backlog draft, partial)

Drafted so far: the **moves and learnsets catalog** epic (E-M1-2), which can start now and run in parallel with M0a. The rest of M1 (fork modernization, BattleService, items, rules, teams, AI) is drafted later; E-M1-1 is reserved for the fork modernization epic.

Refs: concept [12](../architecture/concepts/12-content-catalog-species-moves-items.md), [`mvp.md` § M1](../roadmap/mvp.md#m1-battle-core--catalog)

## E-M1-2 · Catalog: Moves & Learnsets
`Type: Epic` · `Priority: P0`

Import every canon move and learnset from a pinned Showdown version into the DB catalog, with per-generation data, so authoring, display, validation, and TM/HM lists ([E-M3-1](m3-region-authoring.md)) can read them. Showdown stays the battle engine; the catalog holds data only ([12 § Moves](../architecture/concepts/12-content-catalog-species-moves-items.md#moves-import-overrides-and-showdown-callbacks-decided-oct-2026)).

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

**Summary:** The catalog model for moves, shaped as in [12 § Moves](../architecture/concepts/12-content-catalog-species-moves-items.md#moves-import-overrides-and-showdown-callbacks-decided-oct-2026): a resolved Gen 9 `base`, per-gen `genOverrides` (differences only), per-gen `availability` and behavior `hooks`, and text with per-gen blocks.

**Acceptance criteria**
- `moveDefinitionSchema` (Zod) and `moveDefinitionDbSchema` (Mongoose) following the model conventions above. `GenId` is `'gen1' | … | 'gen9'`.
- `MoveData` covers the data fields Showdown uses: type, category, basePower, accuracy (`number | true`), pp, priority, target, flags, secondary/secondaries, critRatio, multihit, recoil, drain, and any other plain-data field present in the source. No functions.
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
- `availability[gen]` from `isNonstandard` (`Past`, `Future`). CAP and other non-canon moves (`isNonstandard: 'CAP'` etc.) are excluded.
- Text from `data/text/moves.ts`, including per-gen blocks.
- Output is deterministic (sorted keys) and written to `scripts/seed/data/moves.json`, so a re-import is a readable diff. The seed loader inserts it.
- Tests against the generated data (worth verifying each against the source when writing them):
  - Bite: Normal type and 10% flinch in Gen 1; Dark from Gen 2.
  - Gust: Normal in Gen 1.
  - Shadow Ball: Physical in Gen 3 (Ghost was a physical type before Gen 4); Crunch: Special in Gen 3.
  - Low Kick has `basePowerCallback` in its hooks for the generations where its power is weight-based.
  - A move removed from Gen 8+ games is `Past` there and available in earlier generations.

**Changes later:** re-point to the fork package once it's published, then re-run and review the diff.

**Refs:** [12 § Moves](../architecture/concepts/12-content-catalog-species-moves-items.md#moves-import-overrides-and-showdown-callbacks-decided-oct-2026)

### M1-03 · `Learnset` model and import
`Type: Task` · `Parent: E-M1-2` · `Priority: P0` · `Size: M` · `Labels: area:shared-models, domain:catalog` · `Blocked by: M1-02 (reuses its import setup)` · `agent-ready: yes` · `Owner: any`

**Summary:** One document per species with Showdown's per-generation source codes, so a region on Gen 1 learnsets filters to `1*` sources (`1L15` = level 15 in Gen 1, `1M` = TM/HM in Gen 1).

**Acceptance criteria**
- `Learnset { speciesId; moves: Record<MoveId, string[]>; source: { showdownVersion } }` with the model conventions above; unique index on `speciesId`.
- Imported through the resolved Dex like M1-02 (base learnsets plus any old-generation mod learnset files, e.g. `data/mods/gen2/learnsets.ts`), deterministic output to `scripts/seed/data/learnsets.json`.
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
