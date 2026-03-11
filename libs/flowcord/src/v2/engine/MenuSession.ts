/**
 * MenuSession — One per user command invocation.
 *
 * Manages the interaction loop lifecycle, state, navigation stack,
 * and delegates rendering/lifecycle to appropriate managers.
 *
 * This is the v2 evolution of v1's Session class.
 * Stub implementation — will be fleshed out in Phase 5.
 */
import { randomUUID } from 'crypto';
import type { ChatInputCommandInteraction, Client } from 'discord.js';
import type { MenuContext, MenuSessionLike } from '../context/MenuContext';
import { StateStore } from '../state/StateStore';
import { MenuStack } from '../state/MenuStack';
import { MenuInstance } from '../menu/MenuInstance';
import { MenuRenderer } from '../menu/MenuRenderer';
import { LifecycleManager } from '../lifecycle/LifecycleManager';
import type { MenuEngine } from './MenuEngine';

export class MenuSession implements MenuSessionLike {
  readonly id: string;
  readonly sessionState: StateStore;

  private readonly _engine: MenuEngine;
  private readonly _commandInteraction: ChatInputCommandInteraction;
  private readonly _stack: MenuStack;
  private readonly _renderer: MenuRenderer;
  private readonly _lifecycleManager: LifecycleManager;

  private _currentMenu: MenuInstance | null = null;
  private _isCancelled = false;
  private _isCompleted = false;

  constructor(engine: MenuEngine, interaction: ChatInputCommandInteraction) {
    this.id = randomUUID().slice(0, 12); // Short session ID for customId prefixing
    this.sessionState = new StateStore();
    this._engine = engine;
    this._commandInteraction = interaction;
    this._stack = new MenuStack();
    this._renderer = new MenuRenderer();
    this._lifecycleManager = new LifecycleManager();

    // Apply global hooks from the engine's HookRegistry
    engine.hookRegistry.applyTo(this._lifecycleManager);
  }

  get client(): Client<true> {
    return this._commandInteraction.client as Client<true>;
  }

  get currentMenu(): MenuInstance | null {
    return this._currentMenu;
  }

  get isCancelled(): boolean {
    return this._isCancelled;
  }

  get isCompleted(): boolean {
    return this._isCompleted;
  }

  /**
   * Initialize the session: defer reply, create initial menu, enter main loop.
   * @param menuName - The registered menu to start with
   * @param options - Command options passed to the menu factory
   */
  async initialize(
    menuName: string,
    options?: Record<string, unknown>
  ): Promise<void> {
    // Defer reply to buy time
    await this._commandInteraction.deferReply();

    // Create the initial menu
    await this.navigateTo(menuName, options);

    // Enter main interaction loop
    await this.processMenus();
  }

  /**
   * Navigate to a registered menu.
   */
  async navigateTo(
    menuId: string,
    options?: Record<string, unknown>
  ): Promise<void> {
    const factory = this._engine.menuRegistry.getFactory(menuId);
    if (!factory) {
      throw new Error(`Menu "${menuId}" is not registered.`);
    }

    // If we have a current menu that's tracked, push it to history
    if (this._currentMenu?.definition.isTrackedInHistory) {
      this._stack.push({
        menuId: this._currentMenu.name,
        options, // store the options we navigated with
      });
    }

    // Fire onLeave on current menu
    if (this._currentMenu) {
      const ctx = this.buildContext(this._currentMenu);
      await this._lifecycleManager.emit(
        'onLeave',
        ctx,
        this._currentMenu.definition.hooks
      );
    }

    // Create new menu definition from factory
    const definition = await factory(this, options);
    const instance = new MenuInstance(definition, this.id);
    this._currentMenu = instance;

    // Fire onEnter
    const ctx = this.buildContext(instance);
    await this._lifecycleManager.emit('onEnter', ctx, definition.hooks);
  }

  /**
   * Go back to the previous menu on the stack.
   */
  async goBack(result?: unknown): Promise<void> {
    void result;
    const entry = this._stack.pop();
    if (!entry) {
      await this.close();
      return;
    }

    // Fire onLeave on current
    if (this._currentMenu) {
      const ctx = this.buildContext(this._currentMenu);
      await this._lifecycleManager.emit(
        'onLeave',
        ctx,
        this._currentMenu.definition.hooks
      );
    }

    // Recreate the previous menu
    const factory = this._engine.menuRegistry.getFactory(entry.menuId);
    if (!factory) {
      throw new Error(
        `Menu "${entry.menuId}" is not registered (cannot go back).`
      );
    }

    const definition = await factory(this, entry.options);
    const instance = new MenuInstance(definition, this.id);
    this._currentMenu = instance;

    const ctx = this.buildContext(instance);
    await this._lifecycleManager.emit('onEnter', ctx, definition.hooks);
  }

  /**
   * End the session.
   */
  async close(): Promise<void> {
    if (this._currentMenu) {
      const ctx = this.buildContext(this._currentMenu);
      await this._lifecycleManager.emit(
        'onLeave',
        ctx,
        this._currentMenu.definition.hooks
      );
    }
    this._isCompleted = true;
  }

  /**
   * Cancel the session.
   */
  async cancel(): Promise<void> {
    if (this._currentMenu) {
      const ctx = this.buildContext(this._currentMenu);
      await this._lifecycleManager.emit(
        'onCancel',
        ctx,
        this._currentMenu.definition.hooks
      );
      await this._lifecycleManager.emit(
        'onLeave',
        ctx,
        this._currentMenu.definition.hooks
      );
    }
    this._isCancelled = true;
  }

  /**
   * Hard refresh — re-run the menu factory from scratch.
   */
  async hardRefresh(): Promise<void> {
    if (!this._currentMenu) return;
    const menuId = this._currentMenu.name;
    const factory = this._engine.menuRegistry.getFactory(menuId);
    if (!factory) return;

    const definition = await factory(this);
    const instance = new MenuInstance(definition, this.id);
    this._currentMenu = instance;
  }

  // -----------------------------------------------------------------------
  // Main interaction loop (stub — will be fleshed out in Phase 5)
  // -----------------------------------------------------------------------

  /**
   * Main event loop. Processes menus until session ends.
   */
  private async processMenus(): Promise<void> {
    // TODO: Phase 5 — full interaction loop
    // For now, just render once to verify the pipeline works
    if (this._currentMenu) {
      await this.render();
    }
  }

  /**
   * Execute a render cycle for the current menu.
   */
  private async render(): Promise<void> {
    if (!this._currentMenu) return;

    const ctx = this.buildContext(this._currentMenu);

    // beforeRender hook
    await this._lifecycleManager.emit(
      'beforeRender',
      ctx,
      this._currentMenu.definition.hooks
    );

    // Run setters — will be expanded in Phase 5
    // afterRender hook
    await this._lifecycleManager.emit(
      'afterRender',
      ctx,
      this._currentMenu.definition.hooks
    );
  }

  /**
   * Build a MenuContext for the current menu instance.
   */
  private buildContext(menuInstance: MenuInstance): MenuContext {
    const baseCtx: MenuContext = {
      session: this,
      menu: menuInstance,
      state: menuInstance.stateAccessor,
      sessionState: this.sessionState,
      client: this.client,
      interaction: this._commandInteraction,
      options: {} as Record<string, unknown>,
      pagination: menuInstance.paginationState,
      env: 'discord',

      goTo: async (menuId: string, options?: Record<string, unknown>) => {
        await this.navigateTo(menuId, options);
      },
      goBack: async (result?: unknown) => {
        await this.goBack(result);
      },
      close: async () => {
        await this.close();
      },
      hardRefresh: async () => {
        await this.hardRefresh();
      },
      openSubMenu: async (menuId: string, opts) => {
        // TODO: Phase 5 — sub-menu with onComplete
        await this.navigateTo(menuId, opts);
      },
      complete: async (result?: unknown) => {
        // TODO: Phase 5 — store result for continuation
        void result;
      },
    };

    // Apply context extensions
    let extendedCtx = baseCtx;
    for (const extension of menuInstance.definition.contextExtensions) {
      const extra = extension(baseCtx);
      extendedCtx = Object.assign(extendedCtx, extra);
    }

    return extendedCtx;
  }
}
