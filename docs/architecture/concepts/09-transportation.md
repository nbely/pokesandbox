# 09: Transportation Networks

> **TL;DR:** Keep the hub model from the original plan. Make every Fly/ferry/train/teleporter difference **pure content**: a network-level `condition` (can I use it at all), per-hub `boardCondition` / `destinationCondition` (evaluated with `$target`), and `fare` effects. Fly is a template, not engine code.

**MVP impact:** Medium · **Cost to change later:** Low

## Current shape
`Region.transportationTypes: string[]` (placeholder). Hubs were agreed in the original plan but not built.

## Design
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
- **Teleport, Dig, and Escape Rope** are not networks. They use the `teleport` effect with `location: 'respawn'` ([06](06-effects.md)), attached to the item or field move. Not every travel mechanic needs to be a network.

## Options

| Option | Pros | Cons |
|---|---|---|
| A. Edges only (with fares) | Already exists | N² edges for Fly. Unmaintainable. |
| **B. Hub networks + conditions** (chosen) | Scales. Content-defined. Covers Fly, ferries, trains, warps. | One more builder screen |
| C. Engine-special-cased Fly | Quick | Hardcodes a design opinion. You explicitly rejected this. |

## MVP scope
- The `TransportNetwork` model, the Fly and Ferry templates, a "Travel ▸ Fly" UI listing eligible destinations (with locked ones explained), and fares via effects.
- Destination lists are grouped by area, paginated, and show each fare, with unaffordable options locked and explained ([26](26-discord-surface-and-ux-patterns.md#menus-and-feedback)).

## Open questions
- ~~Fly: move in party or unlockable service?~~ **Decided (Q17):** creator content, never engine logic. Kanto Classic uses the move-in-party version. Post-MVP builder shortcuts offer both as templates.
- ~~Does arriving by transport trigger scripts?~~ **Decided (Oct 2026):** yes, every arrival counts as entering. The `enteredLocation` event carries `from` and `via` (`walk` or the transport network), and an `enterLocation` trigger can filter on them. A script meant for walking in from specific locations (e.g. the Route 22 rival battle when coming from Viridian) sets `via: ['walk']` and/or `from: [...]`, so flying in skips it. With no filters, it fires on any arrival (e.g. a ferry cutscene).
