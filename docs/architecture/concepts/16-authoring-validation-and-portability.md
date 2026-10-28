# 16: Authoring, Validation & Portability

> **TL;DR:** A region builder is only as good as its **validator**. Make "playability validation" a first-class engine module that runs on publish (and on demand as a "Region Health" report): referential integrity, graph reachability, starter reachability, softlock detection, and balance warnings. Make the compiled release **exportable/importable as JSON**. That's your template system, test fixtures, seed data, backup, and community sharing in one feature.

**MVP impact:** High · **Cost to change later:** Low–medium (but missing it means shipped regions that soft-lock players)

## Current shape
- Discord menu builder (FlowCord) for pokedex, progression, and basic locations.
- `deployable` is a stored boolean that's never computed.
- No integrity checks on delete. Seed data is exported/imported via scripts (`db:export` / `db:seed`), which is a good starting point for a portable format.

## Validator design

```ts
validateRegion(draft) → { errors: Issue[]; warnings: Issue[]; info: Issue[] }
Issue { code: 'EDGE_TARGET_MISSING' | 'UNREACHABLE_LOCATION' | …; severity; subject: Ref; message; fixHint? }
```

**Tier 1: structural (MVP)**
- Every referenced key exists (edges, NPC locations, trainer refs, script labels, items, species in the regional dex).
- Every condition and effect passes its registry `validate()`.
- Starting location set. The starter gift is reachable from the start via `characterCreated` or an `enterLocation` trigger (your roadmap item).
- Trainer parties: species legal, levels 1–100, moves learnable (warning).
- Encounter tables: species in the regional dex, weights > 0.

**Tier 2: graph & progression (MVP-lite → later)**
- **Reachability**: BFS from the start, treating conditions as satisfiable if *some* reachable script/effect can grant what they need. This builds a progression dependency graph from the predicates' `references()` and the effects' writes. Flags:
  - Locations nobody can reach.
  - Milestones nothing grants.
  - Conditions on flags nothing sets.
  - **Cut/Surf soft-locks** (the HM needed to leave an area is only obtainable behind that area).
- A heal point is reachable before the first forced battle.
- Party-variant coverage: for the rival, every `starterChoice` option has a matching party.

**Tier 3: balance hints (later)**
- Level curve per area vs gym leader levels. Money curve vs shop prices. "Route has no encounters". Gym type coverage.

These are **warnings**, never blockers, so creative non-standard games still publish.

## Portability: region bundles
- The compiled release (see [01](01-content-vs-state-and-publishing.md)) serializes to a versioned JSON (or YAML) bundle with content keys (see [02](02-identity-and-references.md)).
- **Import** creates a new draft region from a bundle (rekeying is optional, since keys are region-scoped).
- This gives you:
  - **Template regions** ("Start from Kanto Classic") via the clone-wholesale approach you described in the chat.
  - **Seed data** and **test fixtures** (the engine test harness loads a bundle).
  - **Backups** and moving regions between servers.
  - Power-user authoring in a text editor, and later community sharing.

## Builder UX notes (Discord)
- The builder should surface **"used by"** before deletes ("Badges is used by 4 conditions. Delete anyway?").
- A **"Region Health"** button on `/region` shows validator output grouped by severity, with jump links into the relevant menu.
- **Templates over raw editors** (Gym Leader, Route, Pokémon Center, Starter Gift) keep the "learn by building" goal while preventing 30-step setups.
- **Preview/playtest:** "Play draft as test character". It's the fastest feedback loop for authors (later, but design the engine to support it: a release built from the draft, and a character flagged `isTest`).
- Consider the **webapp as a builder** earlier than planned for graph editing and scripts. Discord is good for quick edits and poor for 200-node graphs.

## MVP scope
- Tier 1 and basic Tier 2 (reachability ignoring conditions, plus "grants exist for required milestones/flags"), the Region Health view, delete-guard "used by", and JSON export/import of a region.

## Principle: Discord-complete authoring (decided Oct 2026)
Every authoring capability must be usable from Discord. The webapp builder is a richer, *additional* client for graphs, scripts, grids, and bulk edits, but never the only path. Both call the same `libs/authoring` commands ([03](03-engine-boundary-and-game-loop.md#authoring-the-same-pattern-for-region-building)), so this costs UI work, not duplicated rules. Lean on Discord Components v2 for denser, more editor-like builder screens. FlowCord support for Components v2 is a dependency to confirm.

## Open questions
- Should **publish be blocked by errors only**, with warnings allowed? (Recommendation: yes.)
- Is a **Kanto template** an official artifact you'll maintain (it doubles as the MVP acceptance test)?
- Webapp builder: in MVP, or strictly post-MVP?
