/**
 * Enhanced MenuRegistry for v2.
 * Maps menu identifiers to factory functions that create menu definitions.
 */
import type { MenuContext } from '../context/MenuContext';
import type { MenuHooks } from '../lifecycle/hooks';
import type {
  Awaitable,
  ButtonConfig,
  ComponentConfig,
  ListPaginationOptions,
  ModalConfig,
  SelectConfig,
  SetButtonsOptions,
} from '../types/common';
import type { EmbedBuilder } from 'discord.js';
import type { MenuSessionLike } from '../context/MenuContext';

/**
 * A menu definition produced by the builder's .build() method.
 * Contains all the configuration needed to instantiate a MenuInstance.
 */
export interface MenuDefinition<TCtx = MenuContext> {
  name: string;
  mode: 'embeds' | 'layout';
  hooks: MenuHooks<TCtx>;
  setup?: (ctx: TCtx) => Awaitable<void>;
  setEmbeds?: (ctx: TCtx) => Awaitable<EmbedBuilder[]>;
  setButtons?: (ctx: TCtx) => Awaitable<ButtonConfig<TCtx>[]>;
  setButtonsOptions?: SetButtonsOptions;
  setSelectMenu?: (ctx: TCtx) => Awaitable<SelectConfig<TCtx>>;
  setModal?: (ctx: TCtx) => Awaitable<ModalConfig<TCtx> | ModalConfig<TCtx>[]>;
  setLayout?: (ctx: TCtx) => Awaitable<ComponentConfig<TCtx>[]>;
  handleMessage?: (ctx: TCtx, response: string) => Awaitable<void>;
  listPagination?: ListPaginationOptions;
  isTrackedInHistory: boolean;
  isCancellable: boolean;
  isReturnable: boolean;
  fallbackMenu?: string;
  fallbackMenuOptions?: Record<string, unknown>;
  contextExtensions: Array<(baseCtx: MenuContext) => Record<string, unknown>>;
}

/**
 * Factory function that creates a MenuDefinition for a given session.
 */
export type CreateMenuDefinitionFn<TCtx = MenuContext> = (
  sessionLike: MenuSessionLike,
  options?: Record<string, unknown>
) => Awaitable<MenuDefinition<TCtx>>;

export class MenuRegistry {
  private readonly _registry = new Map<string, CreateMenuDefinitionFn>();

  /** Register a menu factory by name. */
  register(name: string, factory: CreateMenuDefinitionFn): void {
    if (this._registry.has(name)) {
      throw new Error(
        `Menu "${name}" is already registered. Duplicate registration is not allowed.`
      );
    }
    this._registry.set(name, factory);
  }

  /** Get the factory for a menu by name. */
  getFactory(name: string): CreateMenuDefinitionFn | undefined {
    return this._registry.get(name);
  }

  /** Check if a menu is registered. */
  has(name: string): boolean {
    return this._registry.has(name);
  }

  /** Remove a menu registration. */
  unregister(name: string): boolean {
    return this._registry.delete(name);
  }

  /** Get all registered menu names. */
  get names(): string[] {
    return [...this._registry.keys()];
  }

  /** Clear all registrations. */
  clear(): void {
    this._registry.clear();
  }
}
