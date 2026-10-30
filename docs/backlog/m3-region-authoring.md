# M3: Region Authoring (backlog draft, partial)

Drafted so far: the **TM/HM lists** epic (E-M3-1). The rest of M3 (region config, location kinds and connections, encounters, transport, shops, validator tiers, bundles) is drafted later.

Refs: concept [12 § TM/HM lists](../architecture/concepts/12-content-catalog-species-moves-items.md#tmhm-lists-decided-oct-2026), [`mvp.md` § M3](../roadmap/mvp.md#m3-region-authoring)

## E-M3-1 · TM/HM Lists
`Type: Epic` · `Priority: P0`

Each region defines its own TM/HM list: machine labels mapped to moves, with Gen 1's single-use TMs and reusable HMs. Machine numbering differs per generation, so machines are **region content**, not global items. Bag items use the reserved `machine:<label>` namespace and resolve through the region's list. Compatibility comes from the region's learnset generation ([12 § TM/HM lists](../architecture/concepts/12-content-catalog-species-moves-items.md#tmhm-lists-decided-oct-2026)).

Using a TM from the bag (teaching it to a Pokémon) belongs to the M5 bag work, and shops selling TMs to the M3 shops work; both read this list.

### M3-01 · `Region.moveMachines` model and machine item resolution
`Type: Task` · `Parent: E-M3-1` · `Priority: P0` · `Size: S` · `Labels: area:shared-models, domain:catalog` · `Blocked by: M1-01` · `agent-ready: yes` · `Owner: any`

**Summary:** The region-level list and the helpers every other machine feature uses.

**Acceptance criteria**
- `Region.moveMachines: { label; kind: 'tm' | 'hm'; move: MoveId; reusable: boolean }[]` (Zod + Mongoose, model conventions as in [E-M1-2](m1-battle-core-and-catalog.md#e-m1-2--catalog-moves--learnsets)). Labels are unique within a region and normalized (`TM01`, `HM02`).
- `machineItemId(label) → 'machine:tm01'` and `resolveMachine(region, itemId) → { label, kind, move, reusable } | null`, with tests.
- `isMachineItem(itemId)` recognizes the reserved `machine:` namespace, so the item catalog never needs one document per machine.
- Included in the region's draft content (and, once M0B-21 exists, in the compiled release).

**Refs:** [12 § TM/HM lists](../architecture/concepts/12-content-catalog-species-moves-items.md#tmhm-lists-decided-oct-2026)

### M3-02 · Gen 1 TM/HM preset
`Type: Task` · `Parent: E-M3-1` · `Priority: P1` · `Size: S` · `Labels: domain:catalog` · `Blocked by: M1-02, M3-01` · `agent-ready: yes` · `Owner: any`

**Summary:** The canonical Red/Blue/Yellow numbering (TM01–TM50, HM01–HM05) as a preset the builder can apply in one step, and that the Kanto Classic template generator reuses. Showdown doesn't store TM numbers.

**Acceptance criteria**
- A checked-in preset (`TM01` → `megapunch` … `HM05` → `flash`), sourced from the pret/pokered disassembly's TM/HM move table, with the exact source file noted in the preset.
- Every move ID exists in the catalog and is available in Gen 1 (a test).
- Gen 1 flags: TMs `reusable: false`, HMs `reusable: true`.

**Refs:** [18](../architecture/concepts/18-rules-time-and-randomness.md) (pret/pokered is the Gen 1 reference)

### M3-03 · Machine compatibility and validation
`Type: Task` · `Parent: E-M3-1` · `Priority: P0` · `Size: S` · `Labels: area:authoring, domain:catalog` · `Blocked by: M1-03, M3-01, M0B-22` · `agent-ready: yes` · `Owner: any`

**Summary:** "Which species can learn this machine?" and the publish-time checks for the list.

**Acceptance criteria**
- `compatibleSpecies(region, label)` and `canLearnMachine(region, speciesId, label)`, using the region's learnset generation and machine sources (Gen 1: `1M`). Until `RegionRules` exists (M1), the learnset generation defaults to Gen 1.
- Validator checks registered with the M0B-22 registry: duplicate labels (error), a move that doesn't exist or isn't available in the region's move generation (error), a machine no species in the regional dex can learn (warning).
- Tests with the Gen 1 preset: Pikachu can learn TM24 Thunderbolt; a species without a `1M` source for a machine can't.

**Refs:** [12 § TM/HM lists](../architecture/concepts/12-content-catalog-species-moves-items.md#tmhm-lists-decided-oct-2026), [16](../architecture/concepts/16-authoring-validation-and-portability.md)

### M3-04 · TM/HM list builder (Discord)
`Type: Feature` · `Parent: E-M3-1` · `Priority: P0` · `Size: M` · `Labels: area:bot, area:authoring, domain:catalog` · `Blocked by: M0B-16, M3-01, M3-02, M3-03` · `agent-ready: no` · `Owner: junior`

**Summary:** A region menu for managing the TM/HM list, built on `libs/authoring` commands so the webapp can reuse them later.

**Acceptance criteria**
- Authoring commands: `region.moveMachines.set` (add/edit one machine), `.remove`, `.reorder`, and `.applyPreset` (e.g. Gen 1). Each validates input and returns warnings from M3-03.
- Discord menu: a paginated list ("TM24 · Thunderbolt · 12 species"), add/edit via move search (autocomplete, filtered to moves available in the region's move generation), remove with confirmation, and "Apply Gen 1 preset" (confirms before replacing an existing list).
- Selecting a machine shows the compatible species from the regional dex.
- Follows [26](../architecture/concepts/26-discord-surface-and-ux-patterns.md) (locked options explain themselves; long lists grouped and paginated).

**Refs:** [16 § Authoring](../architecture/concepts/16-authoring-validation-and-portability.md#authoring-the-same-pattern-for-region-building), [26](../architecture/concepts/26-discord-surface-and-ux-patterns.md)
