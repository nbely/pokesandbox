/**
 * Example 06 — Pagination & Guards
 *
 * Demonstrates button pagination, list pagination, and guard pipelines.
 *
 * Slash command: /shop
 * A virtual shop with inventory browsing and purchase validation.
 *
 * Concepts shown:
 *   - Button pagination (setButtons with pagination option)
 *   - List pagination (setListPagination with ctx.pagination)
 *   - fixedPosition buttons that stay pinned across pages
 *   - guard() for pre-action validation
 *   - pipeline() for composing multiple actions
 *   - onNext / onPrevious lifecycle hooks
 */

import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonStyle,
} from 'discord.js';
import {
  FlowCord,
  MenuBuilder,
  type MenuContext,
  goTo,
  pipeline,
  guard,
} from '@flowcord/core';

// --- Types ---
interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  rarity: 'common' | 'rare' | 'legendary';
}

type ShopSessionState = {
  gold: number;
  inventory: string[];
};

type CatalogState = {
  items: ShopItem[];
};

// --- Fake data ---
const shopInventory: ShopItem[] = [
  {
    id: 'potion',
    name: 'Health Potion',
    emoji: '🧪',
    price: 50,
    rarity: 'common',
  },
  {
    id: 'shield',
    name: 'Iron Shield',
    emoji: '🛡️',
    price: 150,
    rarity: 'common',
  },
  {
    id: 'sword',
    name: 'Steel Sword',
    emoji: '⚔️',
    price: 200,
    rarity: 'common',
  },
  { id: 'bow', name: 'Longbow', emoji: '🏹', price: 175, rarity: 'common' },
  { id: 'staff', name: 'Oak Staff', emoji: '🪄', price: 180, rarity: 'common' },
  { id: 'ring', name: 'Silver Ring', emoji: '💍', price: 300, rarity: 'rare' },
  {
    id: 'cape',
    name: 'Enchanted Cape',
    emoji: '🧣',
    price: 400,
    rarity: 'rare',
  },
  {
    id: 'boots',
    name: 'Winged Boots',
    emoji: '👢',
    price: 350,
    rarity: 'rare',
  },
  {
    id: 'amulet',
    name: 'Dragon Amulet',
    emoji: '📿',
    price: 500,
    rarity: 'rare',
  },
  { id: 'helm', name: 'Mithril Helm', emoji: '⛑️', price: 450, rarity: 'rare' },
  {
    id: 'excalibur',
    name: 'Excalibur',
    emoji: '🗡️',
    price: 1000,
    rarity: 'legendary',
  },
  {
    id: 'phoenix',
    name: 'Phoenix Feather',
    emoji: '🪶',
    price: 800,
    rarity: 'legendary',
  },
  {
    id: 'crown',
    name: 'Crown of Wisdom',
    emoji: '👑',
    price: 1200,
    rarity: 'legendary',
  },
];

const rarityColors = { common: 0x95a5a6, rare: 0x3498db, legendary: 0xe67e22 };

// --- Guards ---
const requireGold = (item: ShopItem) =>
  guard<MenuContext<Record<string, unknown>, ShopSessionState>>(async (ctx) => {
    const gold = ctx.sessionState.get('gold') ?? 0;
    return gold >= item.price;
  }, `Not enough gold! You need ${item.price}g.`);

const requireNotOwned = (item: ShopItem) =>
  guard<MenuContext<Record<string, unknown>, ShopSessionState>>(async (ctx) => {
    const inventory = ctx.sessionState.get('inventory') ?? [];
    return !inventory.includes(item.id);
  }, `You already own ${item.name}!`);

// --- Bot setup ---
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const flowcord = new FlowCord({ client });

// ---------------------------------------------------------------------------
// Menu 1: Shop Home (with button pagination)
// ---------------------------------------------------------------------------
flowcord.registerMenu('shop', (session) =>
  new MenuBuilder<Record<string, unknown>, ShopSessionState>(session, 'shop')
    .setup((ctx) => {
      // Initialize player stats in session state
      ctx.sessionState.set('gold', 500);
      ctx.sessionState.set('inventory', []);
    })

    .setEmbeds((ctx) => {
      const gold = ctx.sessionState.get('gold') ?? 0;
      const inventory = ctx.sessionState.get('inventory') ?? [];
      const page = ctx.pagination;

      return [
        new EmbedBuilder()
          .setTitle("🏪 The Adventurer's Shop")
          .setDescription(
            `Welcome, traveler! Browse our wares.\n\n` +
              `💰 **Your Gold:** ${gold}g\n` +
              `🎒 **Items Owned:** ${inventory.length}` +
              (page
                ? `\n\n📄 Page ${page.currentPage} of ${page.totalPages}`
                : '')
          )
          .setColor(0xe67e22)
          .setFooter({ text: 'Each button corresponds to an item for sale' }),
      ];
    })

    // Button pagination: show 4 items per page with Next/Previous buttons
    .setButtons(
      () =>
        shopInventory.map((item) => ({
          label: `${item.emoji} ${item.name} (${item.price}g)`,
          style:
            item.rarity === 'legendary'
              ? ButtonStyle.Danger
              : item.rarity === 'rare'
              ? ButtonStyle.Primary
              : ButtonStyle.Secondary,
          action: goTo('item-detail', { itemId: item.id }),
        })),
      // Pagination config: 4 buttons per page
      {
        pagination: {
          perPage: 4,
          stableButtons: true, // Always show both nav buttons (disabled when N/A)
        },
      }
    )

    // onNext and onPrevious hooks fire when pagination changes
    .onNext((ctx) => {
      console.log(`[Shop] Advanced to page ${ctx.pagination?.currentPage}`);
    })
    .onPrevious((ctx) => {
      console.log(`[Shop] Went back to page ${ctx.pagination?.currentPage}`);
    })

    .setCancellable()
    .setTrackedInHistory()
    .build()
);

// ---------------------------------------------------------------------------
// Menu 2: Item Detail (with guards)
// ---------------------------------------------------------------------------
flowcord.registerMenu('item-detail', (session, options) => {
  const itemId = options?.itemId as string;
  const item = shopInventory.find((i) => i.id === itemId)!;

  return new MenuBuilder(session, 'item-detail')
    .setEmbeds((ctx) => {
      const inventory = ctx.sessionState.get('inventory') ?? [];
      const owned = inventory.includes(item.id);

      return [
        new EmbedBuilder()
          .setTitle(`${item.emoji} ${item.name}`)
          .setDescription(
            `**Rarity:** ${
              item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)
            }\n` +
              `**Price:** ${item.price}g\n\n` +
              (owned
                ? '✅ *You own this item.*'
                : '🛒 *Available for purchase.*')
          )
          .setColor(rarityColors[item.rarity]),
      ];
    })

    .setButtons((ctx) => {
      const inventory = ctx.sessionState.get('inventory') ?? [];
      const owned = inventory.includes(item.id);

      return [
        {
          label: owned ? '✅ Owned' : `🛒 Buy (${item.price}g)`,
          style: owned ? ButtonStyle.Secondary : ButtonStyle.Success,
          disabled: owned,
          // Pipeline: run guards before the purchase action
          action: pipeline(
            requireGold(item),
            requireNotOwned(item),
            async (ctx) => {
              // All guards passed — execute purchase
              const gold = ctx.sessionState.get('gold') ?? 0;
              const inventory = ctx.sessionState.get('inventory') ?? [];

              ctx.sessionState.set('gold', gold - item.price);
              ctx.sessionState.set('inventory', [...inventory, item.id]);
              // Stay on this page — it re-renders to show "Owned"
            }
          ),
        },
      ];
    })

    .setReturnable()
    .build();
});

// ---------------------------------------------------------------------------
// Menu 3: Inventory View (with list pagination)
// ---------------------------------------------------------------------------
flowcord.registerMenu('inventory', (session) =>
  new MenuBuilder<CatalogState, ShopSessionState>(session, 'inventory')
    .setup((ctx) => {
      const ownedIds = ctx.sessionState.get('inventory') ?? [];
      const ownedItems = shopInventory.filter((i) => ownedIds.includes(i.id));
      ctx.state.set('items', ownedItems);
    })

    // List pagination: page through items in the embed
    .setListPagination({
      getTotalQuantityItems: async (ctx) => ctx.state.get('items').length,
      itemsPerPage: 3,
    })

    .setEmbeds((ctx) => {
      const items = ctx.state.get('items');
      const page = ctx.pagination;

      if (items.length === 0) {
        return [
          new EmbedBuilder()
            .setTitle('🎒 Your Inventory')
            .setDescription(
              'Your inventory is empty! Visit the shop to buy items.'
            )
            .setColor(0x95a5a6),
        ];
      }

      // Use pagination state to slice the item array
      const pageItems = page
        ? items.slice(page.startIndex, page.endIndex)
        : items;

      return [
        new EmbedBuilder()
          .setTitle('🎒 Your Inventory')
          .setDescription(
            pageItems
              .map(
                (item, i) =>
                  `**${(page?.startIndex ?? 0) + i + 1}.** ${item.emoji} ${
                    item.name
                  } — *${item.rarity}*`
              )
              .join('\n')
          )
          .setColor(0x2ecc71)
          .setFooter({
            text: page
              ? `Page ${page.currentPage}/${page.totalPages} • ${page.totalItems} items total`
              : `${items.length} items total`,
          }),
      ];
    })

    .setReturnable()
    .build()
);

// --- Interaction handler ---
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'shop') {
      await flowcord.handleInteraction(interaction, 'shop');
    }
  } else if (interaction.isMessageComponent()) {
    flowcord.routeComponentInteraction(interaction);
  }
});

client.once('ready', () => console.log(`Logged in as ${client.user?.tag}`));
client.login(process.env.DISCORD_BOT_TOKEN);
