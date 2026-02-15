# Copilot Instructions

## Project Overview

Full-stack TypeScript NX monorepo for a Pokemon game platform. Two apps share a common library:

### `/shared` — Common Library

- **Models** (`/shared/src/models/`): Mongoose schemas with zod validation, typed static methods, and query helpers for all DB access. Models use the pattern:
  - `z.object()` for the entity schema → `IEntity` type
  - `HydratedDocument<IEntity>` → `Entity` document type
  - `IEntityQueryHelpers` interface for chainable query helpers (e.g., `.byUserId()`, `.byServerId()`)
  - `IEntityModel` interface extending `Model<IEntity, IQueryHelpers>` with static methods (e.g., `createUser()`, `findUserWithServers()`, `upsertUser()`)
  - Export a singleton: `export const Entity = models.Entity || model(...)` to avoid re-registration
- **DTOs** (`/shared/src/dtos/`): Zod schemas with static `convertFromEntity()` methods that use `convertToDTO()` to strip Mongoose internals and convert ObjectIds to strings. Always validate through zod `.parse()`.
- **Utility types**: `PopulatedQuery<TResult, TDoc, TPopulatedFields>` for typed populated queries, `ConvertToDTO<T>` for recursive ObjectId→string conversion.

### `/apps/bot` — Discord.js Bot

- Manages Pokemon game creation/configuration (admin) and gameplay (players).
- Imports models directly from `@shared` for DB operations — no intermediate service layer.
- Key structure:
  - `/classes/` — Custom `Menu`, `AdminMenu`, `Session`, `BotClient` classes for Discord.js interactions
  - `/interactions/guilds/` — Primary location for command development (guild-specific commands)
  - `/interactions/` — Global message, slash, and context menu commands
  - `/events/` — Discord.js client event handlers

### `/apps/webapp` — Next.js Web App

- Server/game discovery + player progress dashboard.
- **Auth**: NextAuth v5 with Discord OAuth (`/apps/webapp/src/auth.ts`). On sign-in, upserts user to DB via tRPC.
- **Routing**: Next.js App Router with route groups:
  - `(public)/` — No auth required. SSR layout with public header/sidebar.
  - `(private)/` — Auth-guarded. Layout calls `auth()` and redirects to `/unauthorized` if no session.
  - `(shared)/` — Accessible by both. Contains shared pages like server/region views.
- **Data access**: All DB access goes through tRPC (no direct Mongoose calls in webapp components).
  - `publicProcedure` — Read-only queries, no auth required (e.g., `getAll`, `getById`)
  - `protectedProcedure` — Requires authenticated session, throws `UNAUTHORIZED` if missing (e.g., `getCurrentUser`)
  - Server-side: `trpcServer()` creates a direct caller with full context (DB + auth). Used in SSR components and `auth.ts` callbacks.
  - Client-side: `trpc` via `createTRPCReact<AppRouter>` + `TRPCProvider` for React Query integration.
  - Router files in `/apps/webapp/src/trpc/routers/` — one per domain (users, servers, regions). Composed in `_app.ts`.
- **Styling**: Tailwind CSS primary, Ant Design for complex components, Sass for advanced cases.
  - Shared styles: `/apps/webapp/src/styles/globals.scss` and `utils.module.scss`
  - Dark mode configured in `tailwind.config.js`
- **Components**: Functional components only. Prefer small reusable components with Tailwind. Use Ant Design for complex UI patterns (tables, modals, forms). Favor SSR for public/read-only pages, client components for interactive/private pages.

## Architecture Rules

These are hard constraints. Do not deviate without asking.

1. **No standalone API server.** The webapp uses tRPC server actions exclusively — no Express, no REST endpoints.
2. **No direct Mongoose calls in webapp components.** All DB access in the webapp flows through tRPC procedures.
3. **Model logic lives in `/shared`.** Static methods, query helpers, and schema definitions belong on the Mongoose model, not in separate service files.
4. **DTOs are the API boundary.** tRPC procedures return DTOs (parsed through zod), never raw Mongoose documents. Use `EntityDTO.convertFromEntity()`.
5. **Auth boundary is the procedure, not the route.** Use `protectedProcedure` for any mutation or user-specific data. Route group layouts provide UI-level guarding, but the real enforcement is at the tRPC layer.
6. **Shared imports use `@shared` alias.** Webapp imports use `@webapp/...` path aliases.

## Coding Conventions

### TypeScript

- Target ES2020+. Use `const`/`let`, async/await, optional chaining, nullish coalescing.
- Prefer zod schemas as the source of truth for types (`z.infer<typeof schema>`).
- Use JSDoc comments for exported functions and complex logic.

### Error Handling

- tRPC procedures: Throw `TRPCError` with appropriate codes (`NOT_FOUND`, `UNAUTHORIZED`, `BAD_REQUEST`).
- Bot commands: Use the existing `errorEmbed` pattern for user-facing errors.
- DB operations: Wrap in try/catch. For multi-document operations, use Mongoose transactions.

### Database (MongoDB + Mongoose)

- Define entity schemas with zod, then build Mongoose schemas that mirror them.
- Expose common access patterns as model statics (e.g., `findServerWithRegions()`) and query helpers (e.g., `.byServerId()`).
- Use `populate()` for relationship loading. Type populated queries with `PopulatedQuery<>`.
- Suggest indexing strategies based on observed query patterns.

### Webapp Styling

- Tailwind for layout/spacing/colors. Use `rem` units, not `px`.
- Shared/reusable classes go in `globals.scss` or `utils.module.scss`.
- Dark mode support is required — test both themes.
- WCAG 2.1 AA compliance: semantic HTML, proper ARIA attributes, alt text, color contrast.

## Complex Changes

For large files (>300 lines) or cross-cutting changes:

1. Present a numbered edit plan before making any changes.
2. List all files/functions affected, the order of changes, and dependencies.
3. Wait for approval before proceeding.
4. Track progress explicitly (e.g., "Completed edit 2 of 5").
