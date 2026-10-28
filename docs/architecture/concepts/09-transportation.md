# 09: Transportation Networks

> **TL;DR:** Keep the hub model agreed with ChatGPT. Make every Fly/ferry/train/teleporter difference **pure content**: a network-level `condition` (can I use it at all), per-hub `boardCondition` / `destinationCondition` (evaluated with `$target`), and `fare` effects. Fly is a template, not engine code.

**MVP impact:** Medium · **Cost to change later:** Low

## Current shape
`Region.transportationTypes: string[]` (placeholder). Hubs were agreed in the chat but not built.

## Proposed shape
```ts
TransportNetwork {
  key; regionId; name;                       // "Fly", "S.S. Anne Ferry", "Magnet Train"
  template?: 'fly' | 'ferry' | 'train' | 'teleport' | 'custom';  // authoring hint only
  condition?: Condition;                     // e.g. all[ party has move 'fly', milestone thunder ]
  hubs: {
    location: ContentKey;
    boardCondition?: Condition;              // can I depart from here?
    destinationCondition?: Condition;        // can I arrive here? (evaluated with target = this hub)
    fare?: Effect[];                         // per-hop costs/effects (ticket item, money)
  }[];
  defaultDestinationCondition?: Condition;   // e.g. Fly: { type: 'visited', location: '$target' }
  boardFrom: 'hubsOnly' | 'anywhere' | { tag: string };  // Fly: anywhere outdoors → { tag: 'outdoors' }
}
```

**Templates:**
- **Fly** = `{ condition: party has fly + badge, boardFrom: { tag: 'outdoors' }, defaultDestinationCondition: visited($target), hubs: [all towns] }`.
- **Ferry** = `{ boardFrom: 'hubsOnly', hubs: [ports], fare: [item s.s.ticket ≥1 condition] }`.
- **Teleport (move)** = `{ hubs: [], destination = character.respawn }`, which needs a special `destination: 'respawn'` option, or model it as an item/move overworld effect `teleport respawn` instead. (Recommendation: the latter. Not every travel mechanic needs to be a network.)

## Options

| Option | Pros | Cons |
|---|---|---|
| A. Edges only (with fares) | Already exists | N² edges for Fly. Unmaintainable. |
| **B. Hub networks + conditions** (recommended, agreed) | Scales. Content-defined. Covers Fly, ferries, trains, warps. | One more builder screen |
| C. Engine-special-cased Fly | Quick | Hardcodes a design opinion. You explicitly rejected this. |

## MVP scope
- The `TransportNetwork` model, the Fly and Ferry templates, a "Travel ▸ Fly" UI listing eligible destinations (with locked ones explained), and fares via effects.

## Open questions
- Does Fly require the **move in the party** (Gen 1–7) or is it an **unlockable service** (Gen 8+ Flying Taxi, Gen 9 any time)? Both are content, but pick the default template.
- Should using a transport **trigger scripts** at the destination (e.g. arriving by ferry plays a cutscene)? Probably yes: the `enterLocation` trigger already fires. Confirm that arrival by any means counts as "entering".
