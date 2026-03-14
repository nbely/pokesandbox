/**
 * MenuContext — the single typed object passed to every v2 callback.
 *
 * Builder subclasses extend the context type via `.extendContext(fn)`.
 * For example, AdminMenuBuilder adds `ctx.admin: AdminHelpers`.
 */
import type { Client, Interaction } from 'discord.js';
import type { MenuEnvironment } from '../types/environment';
import type { Awaitable, PaginationState } from '../types/common';
import type { StateAccessor } from '../state/StateAccessor';
import type { StateStore } from '../state/StateStore';

/**
 * The core context interface passed to all menu callbacks.
 *
 * TState — typed menu-local state (defined by the builder generic)
 * TOptions — typed command options
 */
export interface MenuContext<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TOptions extends Record<string, unknown> = Record<string, unknown>
> {
  /** The current MenuSession instance */
  session: MenuSessionLike;

  /** Runtime wrapper around builder output */
  menu: MenuInstanceLike;

  /** Typed menu-local state (get/set/merge) */
  state: StateAccessor<TState>;

  /** Session-wide key-value state shared across menus */
  sessionState: StateStore;

  /** Discord.js client (logged in) */
  client: Client<true>;

  /** The current interaction */
  interaction: Interaction;

  /** Parsed command options */
  options: TOptions;

  /** Pagination state (null when no pagination active) */
  pagination: PaginationState | null;

  /** Execution environment */
  env: MenuEnvironment;

  // --- Navigation ---

  /** Navigate to another registered menu */
  goTo(menuId: string, options?: Record<string, unknown>): Promise<void>;

  /** Alias for goTo — more descriptive in inline callbacks */
  navigateTo(menuId: string, options?: Record<string, unknown>): Promise<void>;

  /** Pop the navigation stack, returning to the previous menu */
  goBack(result?: unknown): Promise<void>;

  /** End the session */
  close(): Promise<void>;

  /**
   * Re-run createMenu from scratch (for menus whose structure changes based on data).
   * Used ~10% of cases.
   */
  hardRefresh(): Promise<void>;

  // --- Sub-menu ---

  /** Open a sub-menu with a completion callback */
  openSubMenu(menuId: string, opts: SubMenuOptions): Promise<void>;

  /** Mark the current sub-menu as complete, returning a result to the parent's onComplete */
  complete(result?: unknown): Promise<void>;
}

export interface SubMenuOptions {
  onComplete: (ctx: MenuContext, result?: unknown) => Awaitable<void>;
  [key: string]: unknown;
}

/**
 * Minimal session shape referenced by MenuContext.
 * The full MenuSession class implements this.
 * Using an interface avoids circular dependency with the engine module.
 */
export interface MenuSessionLike {
  readonly id: string;
  readonly sessionState: StateStore;
  readonly isCancelled: boolean;
  readonly isCompleted: boolean;
  readonly canGoBack: boolean;
}

/**
 * Minimal menu instance shape referenced by MenuContext.
 * The full MenuInstance class implements this.
 */
export interface MenuInstanceLike {
  readonly name: string;
  readonly mode: 'embeds' | 'layout';
}

/**
 * Response type that determines which interaction collectors the session uses.
 */
export type ResponseType = 'component' | 'message' | 'mixed';

/**
 * A function that extends the context with additional properties.
 * Used by builder subclasses (e.g., AdminMenuBuilder) to add domain helpers.
 */
export type ContextExtension<TExtra extends Record<string, unknown>> = (
  baseCtx: MenuContext
) => TExtra;
