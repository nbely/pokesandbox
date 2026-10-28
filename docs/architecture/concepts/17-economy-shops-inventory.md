# 17: Economy, Shops & Inventory

> **TL;DR:** A **Shop** is content that references the location(s) where it's available. Its inventory entries are individually **conditioned** (badge-tiered marts fall out naturally). Pricing comes from ItemDefinition defaults with shop/region overrides. Money and items change only through effects. Region currency becomes a small config object.

**MVP impact:** Medium · **Cost to change later:** Low

## Current shape
`Region.shops: ObjectId[]` and `Region.currencyType: string` (default `'P'`). The chat sketched `Shop { accessRequirements, tiers: [{ requirements, items }] }`.

## Proposed shape
```ts
Region.currency: { name: 'Pokédollar'; symbol: '₽'; startingAmount: 3000 }

Shop {
  key; regionId; name; locations: ContentKey[]; condition?: Condition;
  entries: { item: ItemId; price?: number; condition?: Condition; stock?: number /* later: limited stock */ }[];
  buyback: { enabled: boolean; rate: number /* default 0.5 */ };
  clerk?: ContentKey;   // optional NPC for flavor dialogue
}
```
- **Tiers** = entries with conditions (Gen 4+ marts add Great Balls at 3 badges). This is more flexible than tier buckets, and the builder can still present "tiers" as a grouping by condition.
- **Department stores** = multiple shops on one location (or one shop per floor node).
- **Special vendors** (the Magikarp salesman, the Game Corner prize exchange) are scripts with `choice` + `effects`, or shops priced in another currency (later: `currency: ItemId` for coins/BP).

## Inventory
- `Character.bag: Record<ItemId, number>`. Pockets come from ItemDefinition. Key items are capped at 1 and can't be sold or tossed.
- Bag capacity: unlimited (modern) vs Gen 1's 20 slots is a rule toggle ([18](18-rules-time-and-randomness.md)).
- Use / give / take outside battle → `useItem` action → ItemDefinition `fieldUse` effects/handlers.

## Money sources and sinks (game-dev)
- **Sources:** trainer payouts (class base × level), selling items, script rewards, (later) Amulet Coin and Pay Day.
- **Sinks:** shops, whiteout penalty (rule: Gen 1 halves money; Gen 4+ uses a badge-based formula), fares, entry costs.
- The validator's Tier 3 can warn when early-route income can't afford the first mart's Poké Balls.

## MVP scope
- Shop model, buy/sell UI, conditioned entries, region currency config, and the bag with pockets plus field use.

## Open questions
- **Multiple currencies** per region (Game Corner coins, Battle Points) in MVP? (Recommendation: no, but keep `currency` as a field on shop entries so it's additive.)
- Should shop stock be **limited or restocking** (daily specials)? Later.
