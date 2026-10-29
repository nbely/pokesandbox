# 08: World Graph & Locations

> **TL;DR:** The directional graph with node- and edge-level gates is right. Add a node **`kind`**, an optional **`parentKey`** for grouping (Mt. Moon floors, buildings in a city), **services** (heal / PC / shop), and **actions** (what the player can *do* here). Let NPCs, triggers, and shops point *at* locations instead of locations listing them. Fix delete integrity.

**MVP impact:** High · **Cost to change later:** Medium

## Current shape (built)
```ts
Location { name, regionId, ordinal, requirements?, connections: { toLocationId, requirements? }[], trainerIds[], wildTables[] }
```
Agreed in the chat but not built: buildings and sub-areas as their own nodes, two-way toggle in the builder, `Region.startingLocationId`.

## Gaps (game-dev lens)

| Gap | Why it matters |
|---|---|
| No node **kind** | The UI should render a town differently from a route, cave floor, building interior, or gym. Fly eligibility, map icons, and "can't use bikes indoors"-style rules key off it. |
| No **grouping** | Viridian City has a Center, Mart, Gym, School, and houses. Without `parentKey`, the travel menu becomes a flat list of 15 places. Mt. Moon's floors should show as one place on the map. |
| No **services** | Healing, PC access, and shops need to be discoverable from the location menu. Heal points also set respawn. |
| No **description / imagery** | Text games live on flavor text and images. Add `description`, `imageUrl`, and an optional map marker. |
| `trainerIds` on Location | Dual-direction risk again. And trainers are better modeled as NPCs placed at a location (see [11](11-npcs-trainers-and-battle-definitions.md)). |
| Delete leaves dangling edges | Deleting a location must remove inbound edges (or the validator must block publish). |
| No **edge metadata** | Labels ("North", "Through the gate", "Cycling Road"), hidden edges (secret passages), `hiddenWhenLocked` |

## Proposed shape
```ts
Location {
  key: ContentKey; regionId; name; description?; imageUrl?; ordinal;
  kind: 'town' | 'route' | 'dungeon' | 'building' | 'gym' | 'landmark' | 'water' | string;  // registry, extensible
  parentKey?: ContentKey;                 // grouping only. Traversal still uses edges.
  condition?: Condition;                  // "can I be here at all"
  edges: { to: ContentKey; label?: string; condition?: Condition; hiddenWhenLocked?: boolean; fare?: Effect[] }[];
  services: ('heal' | 'pc')[];            // shops attach by referencing the location
  encounters: EncounterTable[];           // see 10
  tags?: string[];                        // free-form for conditions/rules ('indoors', 'cave', 'flyable')
}
Region { startingLocationKey; defaultRespawnKey?; … }
```

### Points of interest: inside the node or separate nodes?
- **Separate nodes** for places with their own NPCs, encounters, or gates (gyms, centers, caves, houses with events). This was agreed in the chat. It's cheap and keeps everything uniform.
- **Inside the node** for "things you can interact with here" (NPCs, items on the ground, signs). These are NPC/trigger content that references the location key.

### Travel UX (game-dev)
In a menu-driven text game, the risk is that travel feels like teleporting through a spreadsheet. Two levers:
1. **Grouped menus:** "Viridian City ▸ [Pokémon Center] [Poké Mart] [Gym 🔒] [Route 1 ↓] [Route 2 ↑] [Route 22 ←]". Show locked edges with their explanation.
2. **Arrival flavor + triggers:** entering a node renders its description, runs entry triggers, and lists people and actions here.

## Options: grouping

| Option | Pros | Cons |
|---|---|---|
| A. Flat graph only | Simplest | Unusable menus at scale. Map rendering is hard. |
| **B. Flat graph + `parentKey` grouping** (recommended) | Traversal stays one mechanism, and the UI gets hierarchy | Must validate that grouping doesn't create cycles |
| C. Hierarchical locations with implicit traversal (child ↔ parent always connected) | Fewer edges to author | Implicit rules surprise admins and break one-way designs. The builder can *offer* "auto-connect to parent" instead. |

## MVP scope
- `kind`, `parentKey`, `description`, `imageUrl`, `services`, `tags`, edge labels, the two-way builder toggle, inbound-edge cleanup on delete, `Region.startingLocationKey`, and `defaultRespawnKey`.
- Builder: connections editor, entry rules (conditions), services.
- Later: coordinate-based map markers, auto-generated map images, weather per location.

## Open questions
- ~~Visual map?~~ **Decided (Q7):** text navigation plus an optional static region map image (`graphicSettings.mapImageLink`). Interactive map later, on the webapp.
- ~~Instant travel?~~ **Decided (Q5):** moving between locations is instant. Route friction comes from author-defined **traversal requirements** paid via Explore (a mix of options a and c), not from travel time. See [10 § Traversal requirements](10-encounters.md#traversal-requirements-mvp-decided-oct-2026).
