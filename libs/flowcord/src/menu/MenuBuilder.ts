/**
 * MenuBuilder — fluent builder for FlowCord menu definitions.
 *
 * Primary API for defining menus. Supports:
 * - All v1 methods (setEmbeds, setButtons, setSelectMenu, setModal, setMessageHandler)
 * - Lifecycle hooks (onEnter, onLeave, onCancel, beforeRender, afterRender, etc.)
 * - Display components via setLayout()
 * - Compile-time mode branching (embeds vs layout cannot be mixed)
 * - Context extension for builder subclasses
 * - List and button pagination
 * - fromDefinition() for hybrid object-literal configuration
 *
 * ## Mode Branching
 *
 * The builder uses a generic `TMode` parameter to enforce at the type level
 * that embed-mode methods (.setEmbeds, .setButtons, .setSelectMenu) cannot
 * be mixed with layout-mode methods (.setLayout).
 *
 * @template TState  - Typed menu-local state
 * @template TCtx    - The context type (extended by builder subclasses)
 * @template TMode   - 'unset' | 'embeds' | 'layout' tracks which mode methods have been called
 */
import type { EmbedBuilder } from 'discord.js';
import type { MenuContext } from '../context/MenuContext';
import type { MenuSessionLike, ContextExtension } from '../context/MenuContext';
import type { HookFn, MenuHooks } from '../lifecycle/hooks';
import type {
  Awaitable,
  ButtonConfig,
  ButtonInputConfig,
  ComponentConfig,
  ListPaginationOptions,
  ModalConfig,
  SelectConfig,
  SelectInputConfig,
  SetButtonsOptions,
} from '../types/common';
import type { MenuDefinition } from '../registry/MenuRegistry';

// ---------------------------------------------------------------------------
// Builder class
// ---------------------------------------------------------------------------

export class MenuBuilder<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TSessionState extends Record<string, unknown> = Record<string, unknown>,
  TCtx extends MenuContext<TState, TSessionState> = MenuContext<TState, TSessionState>,
  TMode extends 'unset' | 'embeds' | 'layout' = 'unset'
> {
  protected declare readonly _typeMode?: TMode;

  protected readonly _name: string;
  protected readonly _sessionLike: MenuSessionLike;
  protected readonly _options: Record<string, unknown>;

  // Callbacks
  protected _setup?: (ctx: TCtx) => Awaitable<void>;
  protected _setEmbeds?: (ctx: TCtx) => Awaitable<EmbedBuilder[]>;
  protected _setButtons?: (ctx: TCtx) => Awaitable<ButtonConfig<TCtx>[]>;
  protected _setButtonsOptions?: SetButtonsOptions;
  protected _setSelectMenu?: (ctx: TCtx) => Awaitable<SelectConfig<TCtx>>;
  protected _setModal?: (
    ctx: TCtx
  ) => Awaitable<ModalConfig<TCtx> | ModalConfig<TCtx>[]>;
  protected _setLayout?: (ctx: TCtx) => Awaitable<ComponentConfig<TCtx>[]>;
  protected _handleMessage?: (ctx: TCtx, response: string) => Awaitable<void>;

  // Lifecycle hooks
  protected readonly _hooks: MenuHooks<TCtx> = {};

  // Pagination
  protected _listPagination?: ListPaginationOptions<TCtx>;

  // Options
  protected _isTrackedInHistory = false;
  protected _isCancellable = false;
  protected _isReturnable = false;
  protected _preserveStateOnReturn = false;
  protected _fallbackMenu?: string;
  protected _fallbackMenuOptions?: Record<string, unknown>;

  // Context extensions
  protected readonly _contextExtensions: Array<
    (baseCtx: MenuContext) => Record<string, unknown>
  > = [];

  // Mode tracking (runtime backup for the compile-time generic)
  protected _mode: 'unset' | 'embeds' | 'layout' = 'unset';

  constructor(
    sessionLike: MenuSessionLike,
    name: string,
    options?: Record<string, unknown>
  ) {
    this._sessionLike = sessionLike;
    this._name = name;
    this._options = options ?? {};
  }

  // -----------------------------------------------------------------------
  // Setup
  // -----------------------------------------------------------------------

  /**
   * Static initialization: options parsing, permission checks, computed config.
   * NOT for mutable DB data (always fetch fresh via cache in callbacks).
   */
  setup(fn: (ctx: TCtx) => Awaitable<void>): this {
    this._setup = fn;
    return this;
  }

  // -----------------------------------------------------------------------
  // Embed-mode methods (only when mode is 'unset' or 'embeds')
  // -----------------------------------------------------------------------

  /**
   * Set the embed rendering callback.
   * Switches the builder to embed mode.
   */
  setEmbeds(
    this: MenuBuilder<TState, TSessionState, TCtx, 'unset' | 'embeds'>,
    fn: (ctx: TCtx) => Awaitable<EmbedBuilder[]>
  ): MenuBuilder<TState, TSessionState, TCtx, 'embeds'> {
    this._setEmbeds = fn;
    this._mode = 'embeds';
    return this as unknown as MenuBuilder<TState, TSessionState, TCtx, 'embeds'>;
  }

  /**
   * Set the button rendering callback.
   * Optional pagination options for embed-mode button pagination.
   */
  setButtons(
    this: MenuBuilder<TState, TSessionState, TCtx, 'unset' | 'embeds'>,
    fn: (ctx: TCtx) => Awaitable<ButtonInputConfig<TCtx>[]>,
    options?: SetButtonsOptions
  ): MenuBuilder<TState, TSessionState, TCtx, 'embeds'> {
    this._setButtons = normalizeButtonsFn(fn);
    this._setButtonsOptions = options;
    this._mode = 'embeds';
    return this as unknown as MenuBuilder<TState, TSessionState, TCtx, 'embeds'>;
  }

  /**
   * Set the select menu rendering callback.
   */
  setSelectMenu(
    this: MenuBuilder<TState, TSessionState, TCtx, 'unset' | 'embeds'>,
    fn: (ctx: TCtx) => Awaitable<SelectInputConfig<TCtx>>
  ): MenuBuilder<TState, TSessionState, TCtx, 'embeds'> {
    this._setSelectMenu = normalizeSelectFn(fn);
    this._mode = 'embeds';
    return this as unknown as MenuBuilder<TState, TSessionState, TCtx, 'embeds'>;
  }

  // -----------------------------------------------------------------------
  // Layout-mode methods (only when mode is 'unset' or 'layout')
  // -----------------------------------------------------------------------

  /**
   * Set the layout rendering callback (Components v2 / display components).
   * Switches the builder to layout mode.
   * Cannot be combined with setEmbeds/setButtons/setSelectMenu.
   */
  setLayout(
    this: MenuBuilder<TState, TSessionState, TCtx, 'unset' | 'layout'>,
    fn: (ctx: TCtx) => Awaitable<ComponentConfig<TCtx>[]>
  ): MenuBuilder<TState, TSessionState, TCtx, 'layout'> {
    this._setLayout = fn;
    this._mode = 'layout';
    return this as unknown as MenuBuilder<TState, TSessionState, TCtx, 'layout'>;
  }

  // -----------------------------------------------------------------------
  // Mode-agnostic methods
  // -----------------------------------------------------------------------

  /**
   * Set the modal rendering callback. Works in both modes.
   * Return a single ModalConfig for one modal, or an array for multiple
   * (each with a unique `id` field).
   */
  setModal(
    fn: (ctx: TCtx) => Awaitable<ModalConfig<TCtx> | ModalConfig<TCtx>[]>
  ): this {
    this._setModal = fn;
    return this;
  }

  /** Enable text message input handling. Works in both modes. */
  setMessageHandler(
    fn: (ctx: TCtx, response: string) => Awaitable<void>
  ): this {
    this._handleMessage = fn;
    return this;
  }

  /** Enable the Cancel button. */
  setCancellable(): this {
    this._isCancellable = true;
    return this;
  }

  /** Enable the Back button. */
  setReturnable(): this {
    this._isReturnable = true;
    return this;
  }

  /** Track this menu in the navigation history stack. */
  setTrackedInHistory(): this {
    this._isTrackedInHistory = true;
    return this;
  }

  /**
   * Preserve menu-local state and pagination when returning via goBack().
   * When enabled, the menu's state is snapshot on exit and restored on return,
   * skipping setup() re-initialization. onEnter still fires on return.
   * Requires setTrackedInHistory() to have effect.
   */
  setPreserveStateOnReturn(): this {
    this._preserveStateOnReturn = true;
    return this;
  }

  /**
   * Set a fallback menu for goBack() when the navigation stack is empty.
   * Instead of closing the session, navigates to this menu.
   * Useful for menus that can be opened directly but should return to a parent.
   */
  setFallbackMenu(menuId: string, options?: Record<string, unknown>): this {
    this._fallbackMenu = menuId;
    this._fallbackMenuOptions = options;
    return this;
  }

  /** Configure list pagination (page through items in embeds/layout). */
  setListPagination(opts: ListPaginationOptions<TCtx>): this {
    this._listPagination = opts;
    return this;
  }

  // -----------------------------------------------------------------------
  // Lifecycle hooks
  // -----------------------------------------------------------------------

  onEnter(fn: HookFn<TCtx>): this {
    this._hooks.onEnter = fn as HookFn;
    return this;
  }

  onLeave(fn: HookFn<TCtx>): this {
    this._hooks.onLeave = fn as HookFn;
    return this;
  }

  onCancel(fn: HookFn<TCtx>): this {
    this._hooks.onCancel = fn as HookFn;
    return this;
  }

  beforeRender(fn: HookFn<TCtx>): this {
    this._hooks.beforeRender = fn as HookFn;
    return this;
  }

  afterRender(fn: HookFn<TCtx>): this {
    this._hooks.afterRender = fn as HookFn;
    return this;
  }

  onNext(fn: HookFn<TCtx>): this {
    this._hooks.onNext = fn as HookFn;
    return this;
  }

  onPrevious(fn: HookFn<TCtx>): this {
    this._hooks.onPrevious = fn as HookFn;
    return this;
  }

  onAction(fn: HookFn<TCtx>): this {
    this._hooks.onAction = fn as HookFn;
    return this;
  }

  // -----------------------------------------------------------------------
  // Context extension (used by builder subclasses)
  // -----------------------------------------------------------------------

  /**
   * Add typed properties to the MenuContext.
   * Used by builder subclasses like AdminMenuBuilder to add domain helpers.
   */
  extendContext<TExtra extends Record<string, unknown>>(
    fn: ContextExtension<TExtra>
  ): this {
    this._contextExtensions.push(
      fn as (baseCtx: MenuContext) => Record<string, unknown>
    );
    return this;
  }

  // -----------------------------------------------------------------------
  // fromDefinition (hybrid object-literal alternative)
  // -----------------------------------------------------------------------

  /**
   * Configure the builder from an object literal definition.
   * Merges with any previously-set builder options.
   */
  fromDefinition(def: Partial<MenuDefinitionLiteral<TCtx>>): this {
    if (def.embeds) this._setEmbeds = def.embeds;
    if (def.buttons) this._setButtons = normalizeButtonsFn(def.buttons);
    if (def.layout) this._setLayout = def.layout;
    if (def.selectMenu) this._setSelectMenu = normalizeSelectFn(def.selectMenu);
    if (def.modal) this._setModal = def.modal;
    if (def.messageHandler) this._handleMessage = def.messageHandler;
    if (def.setup) this._setup = def.setup;
    if (def.options?.cancellable) this._isCancellable = true;
    if (def.options?.returnable) this._isReturnable = true;
    if (def.options?.trackInHistory) this._isTrackedInHistory = true;
    if (def.hooks) {
      for (const [name, fn] of Object.entries(def.hooks)) {
        if (fn) {
          (this._hooks as Record<string, unknown>)[name] = fn;
        }
      }
    }
    // Resolve mode
    if (def.layout) this._mode = 'layout';
    else if (def.embeds || def.buttons) this._mode = 'embeds';
    return this;
  }

  // -----------------------------------------------------------------------
  // Build
  // -----------------------------------------------------------------------

  /**
   * Validate the builder configuration and produce a MenuDefinition.
   * Returns MenuDefinition (base MenuContext) since all callbacks are cast
   * to MenuContext internally — TCtx provides type safety at builder time only.
   */
  build(): MenuDefinition {
    // Validate: at least one rendering method must be set
    if (!this._setEmbeds && !this._setLayout) {
      throw new Error(
        `Menu "${this._name}": must call either setEmbeds() or setLayout().`
      );
    }

    // Validate: cannot mix modes (runtime backup for compile-time check)
    if (this._setEmbeds && this._setLayout) {
      throw new Error(
        `Menu "${this._name}": cannot use both setEmbeds() and setLayout(). ` +
          `Choose one rendering mode.`
      );
    }

    // Validate: select menu not allowed with button pagination
    if (this._setSelectMenu && this._setButtonsOptions?.pagination) {
      throw new Error(
        `Menu "${this._name}": select menus cannot be used with button pagination.`
      );
    }

    const mode = this._setLayout ? 'layout' : 'embeds';

    return {
      name: this._name,
      mode,
      hooks: this._hooks as MenuHooks,
      setup: this._setup as ((ctx: MenuContext) => Awaitable<void>) | undefined,
      setEmbeds: this._setEmbeds as
        | ((ctx: MenuContext) => Awaitable<EmbedBuilder[]>)
        | undefined,
      setButtons: this._setButtons as
        | ((ctx: MenuContext) => Awaitable<ButtonConfig<MenuContext>[]>)
        | undefined,
      setButtonsOptions: this._setButtonsOptions,
      setSelectMenu: this._setSelectMenu as
        | ((ctx: MenuContext) => Awaitable<SelectConfig<MenuContext>>)
        | undefined,
      setModal: this._setModal as
        | ((
            ctx: MenuContext
          ) => Awaitable<ModalConfig<MenuContext> | ModalConfig<MenuContext>[]>)
        | undefined,
      setLayout: this._setLayout as
        | ((ctx: MenuContext) => Awaitable<ComponentConfig<MenuContext>[]>)
        | undefined,
      handleMessage: this._handleMessage as
        | ((ctx: MenuContext, response: string) => Awaitable<void>)
        | undefined,
      listPagination: this._listPagination as ListPaginationOptions<MenuContext> | undefined,
      isTrackedInHistory: this._isTrackedInHistory,
      isCancellable: this._isCancellable,
      isReturnable: this._isReturnable,
      preserveStateOnReturn: this._preserveStateOnReturn,
      fallbackMenu: this._fallbackMenu,
      fallbackMenuOptions: this._fallbackMenuOptions,
      contextExtensions: [...this._contextExtensions],
    };
  }
}

// ---------------------------------------------------------------------------
// Object literal definition type (for fromDefinition)
// ---------------------------------------------------------------------------

export interface MenuDefinitionLiteral<TCtx = MenuContext> {
  embeds?: (ctx: TCtx) => Awaitable<EmbedBuilder[]>;
  buttons?: (ctx: TCtx) => Awaitable<ButtonInputConfig<TCtx>[]>;
  layout?: (ctx: TCtx) => Awaitable<ComponentConfig<TCtx>[]>;
  selectMenu?: (ctx: TCtx) => Awaitable<SelectInputConfig<TCtx>>;
  modal?: (ctx: TCtx) => Awaitable<ModalConfig<TCtx> | ModalConfig<TCtx>[]>;
  messageHandler?: (ctx: TCtx, response: string) => Awaitable<void>;
  setup?: (ctx: TCtx) => Awaitable<void>;
  hooks?: MenuHooks<TCtx>;
  options?: {
    cancellable?: boolean;
    returnable?: boolean;
    trackInHistory?: boolean;
  };
}

// ---------------------------------------------------------------------------
// Input → strict normalization wrappers
// ---------------------------------------------------------------------------

/**
 * Wraps a consumer callback returning ButtonInputConfig[] (type optional)
 * into one returning ButtonConfig[] (type required).
 * Used by setter methods so the stored callback is already normalized.
 */
function normalizeButtonsFn<TCtx>(
  fn: (ctx: TCtx) => Awaitable<ButtonInputConfig<TCtx>[]>
): (ctx: TCtx) => Promise<ButtonConfig<TCtx>[]> {
  return async (ctx) => {
    const inputs = await fn(ctx);
    return inputs.map((b) => ({ ...b, type: 'button' as const }));
  };
}

/**
 * Wraps a consumer callback returning SelectInputConfig (type optional)
 * into one returning SelectConfig (type required).
 */
function normalizeSelectFn<TCtx>(
  fn: (ctx: TCtx) => Awaitable<SelectInputConfig<TCtx>>
): (ctx: TCtx) => Promise<SelectConfig<TCtx>> {
  return async (ctx) => {
    const input = await fn(ctx);
    return { ...input, type: 'select' as const };
  };
}
