# Agent Instructions

Guidelines for AI agents working in this NX monorepo. Read before implementing any feature.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Shared Library](#shared-library-shared)
  - [Adding a New Model](#adding-a-new-model)
  - [Adding a New DTO](#adding-a-new-dto)
- [Discord Bot](#discord-bot-appsbot)
  - [Cache-First Data Access](#cache-first-data-access-hard-rule)
  - [Creating Cache Helpers](#creating-cache-helpers-for-a-new-model)
  - [Command Options & Autocomplete](#command-options--autocomplete)
  - [Adding a Slash Command (Menu-based)](#adding-a-slash-command-menu-based)
  - [Reusable Helpers](#reusable-helpers)
- [Web App](#web-app-appswebapp)
  - [Route Organization](#route-organization)
  - [Adding a New Page](#adding-a-new-page)
  - [Adding a tRPC Router](#adding-a-trpc-routerprocedure)
  - [Styling Rules](#styling-rules)
  - [Auth Patterns](#auth-patterns)
- [Cross-Cutting Guidelines](#cross-cutting-guidelines)
  - [Import Aliases](#import-aliases)
  - [Error Handling](#error-handling)
  - [Git Conventions](#git-conventions)

---

## Architecture Overview

| App        | Stack                     | Path               | DB Access                                           |
| ---------- | ------------------------- | ------------------ | --------------------------------------------------- |
| **Bot**    | Discord.js + Mongoose     | `apps/bot/src/`    | Direct model imports from `@shared`                 |
| **Webapp** | Next.js App Router + tRPC | `apps/webapp/src/` | tRPC procedures only — never import models directly |
| **Shared** | Mongoose + Zod            | `shared/src/`      | Models, DTOs, DB connection, cache                  |

### Hard Rules

1. **No standalone API server.** The webapp uses tRPC server actions — no Express, no REST.
2. **No direct Mongoose calls in webapp.** All DB access flows through tRPC procedures.
3. **Model logic lives in `/shared`.** Statics, query helpers, and schemas go on the Mongoose model.
4. **DTOs are the API boundary.** tRPC returns DTOs (zod-parsed), never raw Mongoose docs.
5. **Auth enforcement is at the procedure level.** Use `protectedProcedure` for mutations and user-specific data.
6. **Imports use path aliases.** `@shared/models`, `@shared/dtos`, `@webapp/...`, `@bot/...`.

---

## Shared Library (`/shared`)

### Adding a New Model

Follow this exact pattern. Reference: `shared/src/models/user.model.ts`, `shared/src/models/server.model.ts`.

#### Step 1 — Zod entity schema (source of truth)

```ts
export const itemEntitySchema = z.object({
  name: z.string(),
  description: z.string(),
  rarity: z.enum(['common', 'uncommon', 'rare', 'legendary']),
  region: z.instanceof(Types.ObjectId),
});
```

- Use `z.instanceof(Types.ObjectId)` for all relationship references.
- This schema defines the canonical shape. All types derive from it.

#### Step 2 — Types

```ts
export type IItem = z.infer<typeof itemEntitySchema>;
export type Item = HydratedDocument<IItem>;
```

#### Step 3 — Query helpers interface

```ts
interface IItemQueryHelpers {
  byRegion(regionId: string): QueryWithHelpers<any, Item, IItemQueryHelpers>;
}
```

- Return `QueryWithHelpers<any, Doc, Helpers>` to stay chainable.

#### Step 4 — Model interface with statics

```ts
interface IItemModel extends Model<IItem, IItemQueryHelpers> {
  createItem(item: IItem): Promise<Item>;
  findItemsByRegion(regionId: string): Query<Item[], IItem>;
}
```

- Use `PopulatedQuery<T, TDoc, TPopulatedFields>` (from `shared/src/models/types.ts`) when a static calls `.populate()`:

```ts
findItemWithRegion(filter: QueryFilter<IItem>): PopulatedQuery<Item | null, IItem, { region: Region }>;
```

#### Step 5 — Mongoose Schema definition

```ts
export const itemSchema = new Schema<
  IItem,
  IItemModel,
  Record<string, never>,
  IItemQueryHelpers
>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    rarity: {
      type: String,
      required: true,
      enum: ['common', 'uncommon', 'rare', 'legendary'],
    },
    region: { type: Schema.Types.ObjectId, ref: 'Region', required: true },
  },
  {
    query: {
      byRegion(regionId: string) {
        return this.where({ region: regionId });
      },
    },
    statics: {
      createItem(item: IItem) {
        return this.create(item);
      },
      findItemsByRegion(regionId: string) {
        return this.find().byRegion(regionId);
      },
    },
  }
);
```

- Generic signature: `<IEntity, IModel, Record<string, never>, IQueryHelpers>`.
- Statics and query helpers are defined **inline in the schema options**, not via `.statics()` chains.

#### Step 6 — Singleton export

```ts
export const Item =
  (models.Item as IItemModel) ||
  (model<IItem, IItemModel>('Item', itemSchema, 'items') as IItemModel);
```

- Third argument to `model()` is the explicit **collection name** (lowercase plural).
- The `models.X` check prevents re-registration during HMR.

#### Step 7 — Register in index

Add to `shared/src/models/index.ts`:

```ts
export { Item } from './item.model';
export type { IItem } from './item.model';
```

### Adding a New DTO

Follow this exact pattern. Reference: `shared/src/dtos/server.dto.ts`, `shared/src/dtos/user.dto.ts`.

#### Step 1 — DTO zod schema

Spread the entity schema's `.shape`, override `ObjectId` fields with `z.string()`, add `_id: z.string()`:

```ts
export const itemDTOSchema = z.object({
  ...itemEntitySchema.shape,
  _id: z.string(),
  region: z.string(), // was z.instanceof(Types.ObjectId)
});
export type ItemDTO = z.infer<typeof itemDTOSchema>;
```

#### Step 2 — Static `convertFromEntity`

```ts
export const ItemDTO = {
  convertFromEntity(entity: Item): ItemDTO {
    return itemDTOSchema.parse(convertToDTO(entity));
  },
};
```

Always use `dtoSchema.parse(convertToDTO(entity))` — the zod `.parse()` validates and narrows.

#### Step 3 — Populated variant (if needed)

```ts
export const ItemWithRegionDTOSchema = itemDTOSchema.extend({
  region: regionDTOSchema, // overrides z.string() → full nested DTO
});
export type ItemWithRegionDTO = z.infer<typeof ItemWithRegionDTOSchema>;

export const ItemWithRegionDTO = {
  convertFromEntity(
    entity: Omit<Item, 'region'> & { region: Region }
  ): ItemWithRegionDTO {
    return ItemWithRegionDTOSchema.parse(convertToDTO(entity));
  },
};
```

Note the entity parameter type: `Omit<Doc, 'field'> & { field: PopulatedType }`.

#### Step 4 — Register in index

Add to `shared/src/dtos/index.ts`:

```ts
export { ItemDTO, ItemWithRegionDTO } from './item.dto';
```

---

## Discord Bot (`/apps/bot`)

### Key Concepts

The bot uses a **Session → Menu → Builder** architecture:

- **Session**: Created per user interaction. Manages the interaction loop, history stack, state, and navigation (Back, Cancel, Next, Previous).
- **Menu**: The display unit. Holds embeds, buttons, select menus, modals, and pagination. Rebuilt dynamically on each `refresh()`.
- **MenuBuilder**: Fluent API that constructs a Menu. Method chain sets callbacks for buttons, embeds, select menus, modals, messages.
- **AdminMenu**: Extends Menu for guild-admin commands. Auto-initializes the Server document if missing. Provides `getServer()`, `getRegion()`, `getRegions()`, `getRoles()`.
- **BotClient**: Extends Discord.js `Client`. Central registry of all command/interaction `Collection` maps.

### Cache-First Data Access (Hard Rule)

**Always use cache helpers for DB reads in the bot.** Never call `Model.findById()` or `Model.find()` directly in command code. Use the cache layer in `apps/bot/src/cache/`.

| Do                          | Don't                                   |
| --------------------------- | --------------------------------------- |
| `getCachedServer(guildId)`  | `Server.findOne({ serverId: guildId })` |
| `getCachedRegion(regionId)` | `Region.findById(regionId)`             |
| `getCachedRegions(ids)`     | `Region.find({ _id: { $in: ids } })`    |
| `saveRegion(region)`        | `region.save()`                         |

The only exception is complex queries with aggregations or specific projections that can't be expressed as simple ID lookups. Even then, consider creating a cache-integrated helper.

**In callbacks (buttons, selects, modals, message handlers, embeds), always re-fetch from cache.** Never rely on a closed-over document reference — it may be stale from a prior interaction. The cache pattern ensures fresh data after any save+invalidate:

```ts
// ✅ Correct: re-fetch in every callback
onClick: async (menu) => {
  const region = await menu.getRegion(regionId); // fresh from cache
  region.name = 'New Name';
  await saveRegion(region);                       // save + invalidate
  await menu.refresh();                           // re-runs embed/button callbacks, which re-fetch
},

// ❌ Wrong: using a stale reference from closure
const region = await menu.getRegion(regionId);
onClick: async (menu) => {
  region.name = 'New Name';  // stale! another button may have modified this
  await saveRegion(region);
},
```

This applies equally to `setButtons`, `setEmbeds`, `setSelectMenu`, `setModal`, `setMessageHandler`, `onClick`, `onSelect`, and `onSubmit` callbacks.

### Creating Cache Helpers for a New Model

When adding bot interactions for a new model, create a cache helper file. Reference: `apps/bot/src/cache/cachedRegion.ts`, `apps/bot/src/cache/cachedServer.ts`.

#### Step 1 — Add constants

In `apps/bot/src/cache/constants.ts`, add a prefix and TTL:

```ts
export enum CachePrefix {
  // ... existing
  ITEM = 'item:',
}

export enum CacheTTL {
  // ... existing
  ITEM = 300, // seconds
}
```

#### Step 2 — Create the cache file

```ts
// apps/bot/src/cache/cachedItem.ts
import { getCacheService } from '@shared/cache';
import { Item } from '@shared/models';
import { CachePrefix, CacheTTL } from './constants';

/** Fetch a single item by ID, cache-first. */
export async function getCachedItem(
  itemId: string | undefined
): Promise<Item | null> {
  if (!itemId) return null;
  const cache = getCacheService();
  const key = `${CachePrefix.ITEM}${itemId}`;
  const cached = cache.get<Item>(key);
  if (cached) return cached;
  const item = await Item.findById(itemId).exec();
  if (item) cache.set(key, item, CacheTTL.ITEM);
  return item;
}

/** Fetch a single item by ID, throw if not found. */
export async function getAssertedCachedItem(itemId: string): Promise<Item> {
  const item = await getCachedItem(itemId);
  if (!item)
    throw new Error(
      'There was a problem fetching the item. Please try again later.'
    );
  return item;
}

/** Fetch multiple items by ID, cache-first with batch miss detection. */
export async function getCachedItems(
  ids: (Types.ObjectId | string)[]
): Promise<Item[]> {
  if (!ids.length) return [];
  const cache = getCacheService();
  const stringIds = toIdStrings(ids);
  const itemMap = new Map<string, Item>();
  const missIds: string[] = [];

  for (const id of stringIds) {
    const cached = cache.get<Item>(`${CachePrefix.ITEM}${id}`);
    if (cached) itemMap.set(id, cached);
    else missIds.push(id);
  }

  if (missIds.length > 0) {
    const fetched = await Item.find({ _id: { $in: missIds } }).exec();
    for (const item of fetched) {
      cache.set(`${CachePrefix.ITEM}${item.id}`, item, CacheTTL.ITEM);
      itemMap.set(item.id, item);
    }
  }

  return stringIds
    .map((id) => itemMap.get(id))
    .filter((item): item is Item => item !== undefined);
}

function invalidateItemCache(itemId: string): void {
  getCacheService().del(`${CachePrefix.ITEM}${itemId}`);
}

/** Save an item and invalidate its cache entry. */
export async function saveItem(item: Item): Promise<void> {
  try {
    await item.save();
  } catch (error) {
    throw new Error(
      'There was a problem saving the item. Please try again later.'
    );
  }
  invalidateItemCache(item.id);
}
```

**Notes on save validation:** The `save*` functions receive a `HydratedDocument<IEntity>` — TypeScript enforces the shape at compile time and Mongoose enforces `required`/`enum` at runtime. Zod validation before save is unnecessary. The try/catch wraps `.save()` to provide a user-friendly error if the DB operation fails (network issues, duplicate keys, etc.).

If the model is **read-only** in the bot (like DexEntry), omit the `save*` function.

#### Step 3 — Register in index

Add to `apps/bot/src/cache/index.ts`:

```ts
export {
  getCachedItem,
  getAssertedCachedItem,
  getCachedItems,
  saveItem,
} from './cachedItem';
```

### Command Options & Autocomplete

Reference: `apps/bot/src/interactions/guilds/.../region/region.ts`, `apps/bot/src/utils/autocompleteHelpers.ts`.

#### Defining options on a slash command

Use discord.js option builders on the `SlashCommandBuilder`:

```ts
command: new SlashCommandBuilder()
  .setName('item')
  .setDescription('Manage an item')
  .setContexts(InteractionContextType.Guild)
  .addStringOption((option) =>
    option
      .setName('item_id')
      .setDescription('The item to manage')
      .setRequired(true)
      .setAutocomplete(true)   // enables autocomplete for this option
  )
  .addIntegerOption((option) =>
    option
      .setName('quantity')
      .setDescription('How many')
      .setRequired(false)
  ),
```

Options are read in `createMenu` via `session.interaction.options.getString('item_id')`.

#### Implementing autocomplete

Add an `autocomplete` handler on the command and create a reusable helper in `apps/bot/src/utils/autocompleteHelpers.ts`:

```ts
// In autocompleteHelpers.ts — reusable choice generator
export async function getItemChoices(
  guildId: string,
  focusedValue: string
): Promise<{ name: string; value: string }[]> {
  const server = await getCachedServer(guildId);
  if (!server) return [];
  const items = await getCachedItems(server.items); // always use cache
  const choices = items.map((item) => ({ name: item.name, value: item.id }));
  return filterAndFormatChoices(choices, focusedValue);
}

// Reusable autocomplete handler
export async function handleItemAutocomplete(
  client: BotClient,
  interaction: AutocompleteInteraction
): Promise<void> {
  const guildId = interaction.guild?.id;
  if (!guildId) return;
  const focused = interaction.options.getFocused();
  const choices = await getItemChoices(guildId, focused);
  await interaction.respond(choices);
}
```

```ts
// On the command definition
export const ItemCommand: ISlashCommand<AdminMenu> = {
  name: 'item',
  autocomplete: handleItemAutocomplete,  // reusable handler
  command: /* ... */,
  createMenu: /* ... */,
};
```

`filterAndFormatChoices(choices, focusedValue)` — provided in `autocompleteHelpers.ts` — does case-insensitive filtering and caps at 25 results (Discord's limit). **Always use cache helpers in autocomplete** — never hit the DB directly.

For commands with **multiple autocomplete options**, check `interaction.options.getFocused(true).name` to determine which field is active:

```ts
autocomplete: async (client, interaction) => {
  const focused = interaction.options.getFocused(true);
  if (focused.name === 'region_id') {
    await handleRegionAutocomplete(client, interaction);
  } else if (focused.name === 'item_id') {
    await handleItemAutocomplete(client, interaction);
  }
},
```

### Adding a Slash Command (Menu-based)

This is the primary pattern. Almost all commands use `createMenu` rather than `execute`. Reference: `apps/bot/src/interactions/guilds/1010726453974925402/slashCommands/serverManagement/server/server.ts`.

#### File structure

```
apps/bot/src/interactions/guilds/{guildId}/slashCommands/{domain}/{commandName}/
├── {commandName}.ts          # Command definition + createMenu + button callbacks
├── {commandName}.embeds.ts   # Embed builder functions
├── types.ts                  # Command-specific option types (if needed)
└── index.ts                  # Re-exports
```

#### Command definition

```ts
import { ISlashCommand } from '@bot/structures/interfaces/commands';
import { AdminMenu, AdminMenuBuilder } from '@bot/classes';

export const MyCommand: ISlashCommand<AdminMenu> = {
  name: 'mycommand',
  anyUserPermissions: ['Administrator'],        // Discord permissions needed (any match)
  onlyRoles: onlyAdminRoles,                    // Custom role restrictions
  onlyRolesOrAnyUserPermissions: true,          // OR logic between roles and permissions
  command: new SlashCommandBuilder()
    .setName('mycommand')
    .setDescription('Does something')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session): Promise<AdminMenu> =>
    new AdminMenuBuilder(session, COMMAND_NAME)
      .setButtons(getMyButtons)                 // (menu: AdminMenu) => MenuButtonConfig[]
      .setEmbeds(getMyEmbeds)                   // (menu: AdminMenu) => EmbedBuilder[]
      .setSelectMenu(getMySelectMenu)           // optional
      .setModal(getMyModal)                     // optional
      .setCancellable()                         // adds Cancel button
      .setReturnable()                          // adds Back button to return to previous menu
      .setTrackedInHistory()                    // enables back navigation to this menu
      .setListPagination({ ... })               // optional: paginated lists (automatically paginates buttons by default)
      .build(),
};
```

#### Button callbacks (key pattern)

Buttons are defined as `MenuButtonConfig` objects with an `onClick` callback. Inside `onClick`, use `MenuWorkflow` for sub-menu navigation:

```ts
const getMyButtons = (menu: AdminMenu): MenuButtonConfig<AdminMenu>[] => [
  {
    label: 'Edit Name',
    style: ButtonStyle.Primary,
    onClick: async (menu) => {
      // Open the set modal, navigate to sub-menu, or update data directly
      await menu.openModal({ ... });
    },
  },
  {
    label: 'View Regions',
    style: ButtonStyle.Secondary,
    onClick: async (menu) => {
      // Navigate to another menu with continuation
      await MenuWorkflow.openSubMenuWithContinuation(menu, 'regionselect', (result) => {
        menu.session.setState('selectedRegion', result);
      });
    },
  },
];
```

#### Navigation patterns

| Method                                                             | Use Case                                       |
| ------------------------------------------------------------------ | ---------------------------------------------- |
| `MenuWorkflow.openMenu(menu, commandName)`                         | Navigate to another slash command's menu       |
| `MenuWorkflow.openSubMenuWithContinuation(menu, name, onComplete)` | Open sub-menu, receive result on return        |
| `MenuWorkflow.completeAndReturn(menu, result)`                     | Return result to the previous menu             |
| `menu.session.goBack()`                                            | Go back in history                             |
| `menu.hardRefresh()`                                               | Recreate menu from scratch via `createMenu`    |
| `menu.refresh()`                                                   | Re-run all builder callbacks to update display |

#### Error handling

Use `buildErrorEmbed` from `@bot/embeds/errorEmbed` for user-facing errors. For unrecoverable errors, `session.handleError(error)` edits the message and cancels the session.

### Registration

After creating the command:

1. Export it from the domain `index.ts`.
2. Add it to the guild's `slashCommands` array in `apps/bot/src/interactions/guilds/{guildId}/index.ts`.
3. The manager (`apps/bot/src/structures/managers/slashCommands.ts`) auto-discovers it via these index files.

### Reusable Helpers

Keep common helpers organized:

| Category             | Location                                              | Examples                                             |
| -------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| Cache helpers        | `apps/bot/src/cache/`                                 | `getCachedServer`, `saveRegion`, `getCachedItems`    |
| Autocomplete helpers | `apps/bot/src/utils/autocompleteHelpers.ts`           | `handleRegionAutocomplete`, `filterAndFormatChoices` |
| Embed factories      | `{commandName}.embeds.ts` co-located with the command | `getServerMenuEmbeds`, `getRegionMenuEmbeds`         |
| Error embeds         | `apps/bot/src/embeds/errorEmbed.ts`                   | `buildErrorEmbed`                                    |

When adding a feature that introduces a new model to the bot, create these in order:

1. **Cache helper file** (`apps/bot/src/cache/cached{Model}.ts`) — fetch, fetchMany, asserted fetch, save+invalidate
2. **Autocomplete helper** (if the model is selectable via commands) — add to `autocompleteHelpers.ts`
3. **Command file(s)** with embeds — use the cache helpers and autocomplete helpers

### Standalone Interactions (Advanced)

Buttons, select menus, and modals **outside** the Menu system are registered as standalone commands. These are currently unused but supported:

- `apps/bot/src/interactions/buttons/` → `IButtonCommand { customId, execute }`
- `apps/bot/src/interactions/stringSelectMenus/` → `IStringSelectMenu { customId, execute }`
- `apps/bot/src/interactions/modalForms/` → `IModalForm { customId, execute }`

Prefer using the Menu system unless you have a specific reason not to.

---

## Web App (`/apps/webapp`)

### Route Organization

```
app/
├── (public)/     # No auth required. SSR layout with public header/sidebar.
├── (private)/    # Auth-guarded. Layout calls auth() and redirects if no session.
├── (shared)/     # Accessible by both. Uses SharedPage for auth-aware rendering.
├── api/          # NextAuth handler + tRPC fetch adapter only.
├── _components/  # Shared reusable components (underscore = not a route).
├── _hooks/       # Shared hooks.
└── _providers/   # SessionProvider + ThemeProvider.
```

Route groups `(public)`, `(private)`, `(shared)` don't appear in URLs.

### Adding a New Page

#### Step 1 — Choose the route group

| Route Group  | When to Use                                  |
| ------------ | -------------------------------------------- |
| `(public)/`  | Read-only, no user context needed            |
| `(private)/` | Requires authenticated session               |
| `(shared)/`  | Same URL, different UI for auth/unauth users |

#### Step 2 — Create the page files

The standard pattern is a **thin SSR wrapper** + **client component**:

```tsx
// apps/webapp/src/app/(shared)/items/page.tsx (Server Component)
import ItemsPage from './ItemsPage';
export default function Page() {
  return <ItemsPage />;
}
```

```tsx
// apps/webapp/src/app/(shared)/items/ItemsPage.tsx
'use client';
import { trpc } from '@webapp/trpc';

const ItemsPage = () => {
  const { data: items = [], isLoading } = trpc.items.getAll.useQuery();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {items.map((item) => (
        <ItemCard key={item._id} item={item} />
      ))}
    </div>
  );
};

export default ItemsPage;
```

#### Step 3 — For auth-aware shared pages, use the SharedPage pattern

Reference: `apps/webapp/src/app/(shared)/page.tsx` and `SharedPage.tsx`.

```tsx
// page.tsx
export default async function Page() {
  return (
    <SharedPage
      privatePage={async (userId) => <ItemsPagePrivate userId={userId} />}
      publicPage={async () => <ItemsPagePublic />}
    />
  );
}
```

#### Step 4 — For dynamic routes use `[id]`

```
apps/webapp/src/app/(shared)/items/[id]/page.tsx
```

Access params via `({ params }: { params: { id: string } })` in the page component.

### Adding a tRPC Router/Procedure

Reference: `apps/webapp/src/trpc/routers/servers.ts`, `apps/webapp/src/trpc/routers/users.ts`.

#### Step 1 — Create the router file

```ts
// apps/webapp/src/trpc/routers/items.ts
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../init';
import { Item } from '@shared/models';
import { ItemDTO, ItemWithRegionDTO } from '@shared/dtos';
import { TRPCError } from '@trpc/server';

export const itemsRouter = router({
  getAll: publicProcedure.query(async () => {
    const items = await Item.find().exec();
    return items.map((item) => ItemDTO.convertFromEntity(item));
  }),

  getById: publicProcedure.input(z.string()).query(async ({ input }) => {
    const item = await Item.findById(input).populate('region').exec();
    if (!item)
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not found' });
    return ItemWithRegionDTO.convertFromEntity(item);
  }),

  addToInventory: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // ctx.session available on protectedProcedure
      // ... mutation logic
    }),
});
```

#### Step 2 — Register in the app router

```ts
// apps/webapp/src/trpc/routers/_app.ts
import { itemsRouter } from './items';

export const appRouter = router({
  regions: regionsRouter,
  servers: serversRouter,
  users: usersRouter,
  items: itemsRouter, // add here
});
```

#### Step 3 — (Optional) Add to root layout hydration

If the data is global and used on many pages, pre-fetch in the root layout and hydrate:

- `apps/webapp/src/app/layout.tsx` — add the `trpcServer().items.getAll()` call.
- `apps/webapp/src/app/_components/Hydrator.tsx` — add the `utils.items.getAll.setData(undefined, data)` call.

### Styling Rules

- **Tailwind first** for all layout, spacing, colors. Use `rem` units.
- **Ant Design** for complex components (tables, modals, forms, autocomplete).
- **Dark mode required.** Every Tailwind class needs a `dark:` variant. Custom colors: `gold-*` (light), `dgold-*` (dark).
- **Component classes** go in `apps/webapp/src/styles/globals.scss` with `@layer components`.
- **WCAG 2.1 AA**: semantic HTML, ARIA attributes, alt text, color contrast.

### Auth Patterns

| Context                     | How to Access                                                 |
| --------------------------- | ------------------------------------------------------------- |
| Server Components / Layouts | `const session = await auth()`                                |
| Client Components           | `const { data: session } = useSession()`                      |
| tRPC Procedures             | `ctx.session` (available on `protectedProcedure`)             |
| tRPC Server Caller          | `const api = await trpcServer()` (auto-includes auth context) |

---

## Cross-Cutting Guidelines

### Import Aliases

| Alias                  | Maps To                             |
| ---------------------- | ----------------------------------- |
| `@shared/models`       | `shared/src/models/index.ts`        |
| `@shared/dtos`         | `shared/src/dtos/index.ts`          |
| `@shared/connectDb`    | `shared/src/connectDb.ts`           |
| `@shared/cache`        | `shared/src/cache/index.ts`         |
| `@webapp/components/*` | `apps/webapp/src/app/_components/*` |
| `@webapp/auth`         | `apps/webapp/src/auth.ts`           |
| `@webapp/trpc`         | `apps/webapp/src/trpc/index.ts`     |
| `@webapp/trpc/*`       | `apps/webapp/src/trpc/*`            |
| `@webapp/styles/*`     | `apps/webapp/src/styles/*`          |
| `@bot/*`               | `apps/bot/src/*`                    |

### Error Handling

| Context         | Pattern                                                                                 |
| --------------- | --------------------------------------------------------------------------------------- |
| tRPC procedures | Throw `TRPCError` with code: `NOT_FOUND`, `UNAUTHORIZED`, `BAD_REQUEST`                 |
| Bot commands    | Use `buildErrorEmbed(client, member, description)` for user-facing errors               |
| Bot sessions    | `session.handleError(error)` for unrecoverable errors (edits message + cancels session) |
| DB operations   | Wrap in try/catch. Use Mongoose transactions for multi-document operations.             |

### Git Conventions

- Branch from `main`. Branch names: `feat/`, `fix/`, `chore/`, `docs/`.
- One logical change per commit. If a feature spans shared + bot + webapp, structure commits by layer.
- Run `nx affected --target=lint` and `nx affected --target=test` before pushing.

### Validation Strategy

- **Zod is the source of truth** for all data shapes.
- **Entity schemas** validate at the model layer (inputs).
- **DTO schemas** validate at the API boundary (outputs).
- **No Mongoose validators** beyond `required: true` — defer to zod.
- **No Mongoose middleware** (pre/post hooks) — keep side effects explicit.
