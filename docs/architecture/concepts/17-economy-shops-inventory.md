# 17: Economy, Shops & Inventory

> **TL;DR:** A **Shop** is content that references the location(s) where it's available. Its inventory entries are individually **conditioned** (badge-tiered marts fall out naturally). Pricing comes from ItemDefinition defaults with shop/region overrides. Money and items change only through effects. Region currency becomes a small config object.

**MVP impact:** Medium · **Cost to change later:** Low

## Current shape
`Region.shops: ObjectId[]` and `Region.currencyType: string` (default `'P'`). The original plan sketched `Shop { accessRequirements, tiers: [{ requirements, items }] }`.

## Design
```ts
Region.currency: { name: 'Pokédollar'; symbol: '₽'; startingAmount: 3000 }

Shop {
  key; regionId; name; locations: ContentKey[]; condition?: Condition;
  entries: { key: ContentKey; item: ItemId; price?: number; currency?: ProgressionKey; condition?: Condition;   // no currency = money
             limit?: { count: number; per: 'journey' } }[];   // reserved, post-MVP: purchase limits; later also per: 'server', restock schedules
  buyback: { enabled: boolean; rate: number /* default 0.5 */ };
  clerk?: ContentKey;   // optional NPC for flavor dialogue
}
```
- **Tiers** = entries with conditions (Gen 4+ marts add Great Balls at 3 badges). This is more flexible than tier buckets, and the builder can still present "tiers" as a grouping by condition.
- **Department stores** = multiple shops on one location (or one shop per floor node).
- **Other currencies are numeric progressions (decided Oct 2026).** Money is the one built-in currency. A shop entry with `currency: <progression key>` is priced in that counter: Game Corner coins, Battle Points, event tokens. Buying checks the counter ≥ price and decrements it in the same atomic effect list (preflight, like money). Earning them is ordinary content: a script that sells coins for money, or a progression effect on a reward. The Game Corner prize counter (Porygon, TMs) works this way in MVP; the slot machines come later.
- **Special vendors** (the Magikarp salesman) are scripts with `choice` + `effects`.

## Inventory
- `Journey.bag: Record<ItemId, number>`. Pockets come from ItemDefinition. Key items are capped at 1 and can't be sold or tossed.
- Bag capacity: unlimited (modern) vs Gen 1's 20 slots is a rule toggle ([18](18-rules-time-and-randomness.md)).
- Use / give / take outside battle → `useItem` action → ItemDefinition `fieldUse` effects/handlers.

## Money sources and sinks (game-dev)
- **Sources:** trainer payouts (class base × level), selling items, script rewards, (later) Amulet Coin and Pay Day.
- **Sinks:** shops, whiteout penalty (rule: Gen 1 halves money; Gen 4+ uses a badge-based formula), fares, entry costs.
- The validator's Tier 3 can warn when early-route income can't afford the first mart's Poké Balls.

## MVP scope
- Shop model, buy/sell UI, conditioned entries, entries priced in a numeric progression, region currency config, and the bag with pockets plus field use.

## Open questions
- ~~Multiple currencies?~~ **Decided (Oct 2026):** money is the only built-in currency. Anything else is a numeric progression that shop entries can be priced in (see above).
- ~~Limited or restocking stock?~~ **Decided (Oct 2026):** post-MVP. Gen 1 shops (Celadon's TMs included) sell without limit. The `limit` field is reserved: per-journey purchase limits first (counted in a reserved flag `shop:<shopKey>:<entryKey>:bought`, keyed by the entry's stable key so limits survive republishes), then restocking and server-wide stock.
