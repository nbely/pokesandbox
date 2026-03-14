/**
 * MenuSession — One per user command invocation.
 *
 * Manages the interaction loop lifecycle, state, navigation stack,
 * and delegates rendering/lifecycle to appropriate managers.
 *
 * This is the v2 evolution of v1's Session class.
 */
import { randomUUID } from 'crypto';
import type {
  ChatInputCommandInteraction,
  Client,
  Interaction,
  Message,
  MessageComponentInteraction,
  ModalSubmitInteraction,
} from 'discord.js';
import type {
  MenuContext,
  MenuSessionLike,
  SubMenuOptions,
} from '../context/MenuContext';
import type { Action } from '../types/common';
import { GuardFailedError } from '../action/pipeline';
import { StateStore } from '../state/StateStore';
import { MenuStack } from '../state/MenuStack';
import { MenuInstance } from '../menu/MenuInstance';
import { MenuRenderer } from '../menu/MenuRenderer';
import { LifecycleManager } from '../lifecycle/LifecycleManager';
import { ComponentIdManager } from '../components/ComponentIdManager';
import type { MenuEngine } from './MenuEngine';

/** Continuation registered by openSubMenu — fired when the sub-menu calls goBack. */
interface Continuation {
  menuName: string;
  onComplete: (ctx: MenuContext, result?: unknown) => Promise<void>;
}

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

  /**
   * Tracks whether navigation happened during the current action.
   * When true the main loop skips auto-refresh and jumps straight
   * to the new menu's enter → render cycle.
   */
  private _didNavigate = false;

  /**
   * Tracks whether the current action requested a hard refresh.
   * When true the main loop re-runs the menu factory before rendering.
   */
  private _didHardRefresh = false;

  /**
   * The component interaction that showed a modal via showModal().
   * Kept so awaitModalInteraction can call awaitModalSubmit on it.
   */
  private _modalShowInteraction: MessageComponentInteraction | null = null;

  /** Pending continuations for sub-menu completion. */
  private readonly _continuations: Continuation[] = [];

  /** Result stored by ctx.complete() for sub-menu return. */
  private _completionResult: unknown = undefined;

  /** Options that were used to create the current menu (kept for hardRefresh). */
  private _currentOptions: Record<string, unknown> | undefined;

  /** The most recent interaction (updated on every component/modal interaction). */
  private _latestInteraction: Interaction;

  constructor(engine: MenuEngine, interaction: ChatInputCommandInteraction) {
    this.id = randomUUID().slice(0, 12);
    this.sessionState = new StateStore();
    this._engine = engine;
    this._commandInteraction = interaction;
    this._stack = new MenuStack();
    this._renderer = new MenuRenderer();
    this._lifecycleManager = new LifecycleManager();
    this._latestInteraction = interaction;

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

  /** Whether goBack() has somewhere to go (stack or fallback menu). */
  get canGoBack(): boolean {
    return !this._stack.isEmpty || !!this._currentMenu?.definition.fallbackMenu;
  }

  // -----------------------------------------------------------------------
  // Public lifecycle API
  // -----------------------------------------------------------------------

  /**
   * Initialize the session: defer reply, create initial menu, enter main loop.
   */
  async initialize(
    menuName: string,
    options?: Record<string, unknown>
  ): Promise<void> {
    await this._commandInteraction.deferReply();
    await this.navigateTo(menuName, options);
    await this.processMenus();

    // Clean up after loop exits
    this._engine.removeSession(this.id);
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
        options: this._currentOptions,
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

    // Trace navigation
    if (this._engine.tracer && this._currentMenu) {
      this._engine.tracer.record({
        from: this._currentMenu.name,
        to: menuId,
        sessionId: this.id,
        userId: this._commandInteraction.user.id,
        timestamp: Date.now(),
      });
    }

    // Create new menu
    this._currentOptions = options;
    const definition = await factory(this, options);
    const instance = new MenuInstance(definition, this.id);
    this._currentMenu = instance;

    // Run setup if defined
    if (definition.setup) {
      const ctx = this.buildContext(instance);
      await definition.setup(ctx);
    }

    // Fire onEnter
    const ctx = this.buildContext(instance);
    await this._lifecycleManager.emit('onEnter', ctx, definition.hooks);

    this._didNavigate = true;
  }

  /**
   * Go back to the previous menu on the stack.
   */
  async goBack(result?: unknown): Promise<void> {
    const entry = this._stack.pop();
    if (!entry) {
      // Check for a fallback menu before closing
      const fallbackMenu = this._currentMenu?.definition.fallbackMenu;
      const fallbackMenuOptions =
        this._currentMenu?.definition.fallbackMenuOptions;
      if (fallbackMenu) {
        // Navigate to fallback WITHOUT pushing current menu to stack
        // (prevents circular navigation when the menu was opened directly)
        const factory = this._engine.menuRegistry.getFactory(fallbackMenu);
        if (!factory) {
          throw new Error(`Fallback menu "${fallbackMenu}" is not registered.`);
        }

        if (this._currentMenu) {
          const ctx = this.buildContext(this._currentMenu);
          await this._lifecycleManager.emit(
            'onLeave',
            ctx,
            this._currentMenu.definition.hooks
          );
        }

        this._currentOptions = fallbackMenuOptions;
        const definition = await factory(this, fallbackMenuOptions);
        const instance = new MenuInstance(definition, this.id);
        this._currentMenu = instance;

        if (definition.setup) {
          const ctx = this.buildContext(instance);
          await definition.setup(ctx);
        }

        const ctx = this.buildContext(instance);
        await this._lifecycleManager.emit('onEnter', ctx, definition.hooks);
        this._didNavigate = true;
        return;
      }

      await this.close();
      return;
    }

    const completedMenuName = this._currentMenu?.name;

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

    this._currentOptions = entry.options;
    const definition = await factory(this, entry.options);
    const instance = new MenuInstance(definition, this.id);
    this._currentMenu = instance;

    // Run setup
    if (definition.setup) {
      const ctx = this.buildContext(instance);
      await definition.setup(ctx);
    }

    // Fire onEnter
    const ctx = this.buildContext(instance);
    await this._lifecycleManager.emit('onEnter', ctx, definition.hooks);

    // Execute continuations from sub-menu completion
    if (completedMenuName) {
      await this.executeContinuations(completedMenuName, result, ctx);
    }

    this._didNavigate = true;
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
    await this._renderer.renderClosed(this._commandInteraction);
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
    await this._renderer.renderCancelled(this._commandInteraction);
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

    const definition = await factory(this, this._currentOptions);
    const instance = new MenuInstance(definition, this.id);
    this._currentMenu = instance;

    // Run setup
    if (definition.setup) {
      const ctx = this.buildContext(instance);
      await definition.setup(ctx);
    }

    this._didHardRefresh = true;
  }

  /**
   * Open a sub-menu with an onComplete continuation.
   */
  async openSubMenu(menuId: string, opts: SubMenuOptions): Promise<void> {
    // Extract options (everything except onComplete)
    // Register continuation before navigating

    const { onComplete, ...navOptions } = opts;
    this._continuations.push({
      menuName: menuId,
      onComplete: onComplete as (
        ctx: MenuContext,
        result?: unknown
      ) => Promise<void>,
    });

    await this.navigateTo(menuId, navOptions as Record<string, unknown>);
  }

  /**
   * Mark the current sub-menu as complete with a result.
   * The result will be passed to the parent's onComplete when goBack fires.
   */
  complete(result?: unknown): void {
    this._completionResult = result;
  }

  /**
   * Route an externally-received component interaction to this session.
   * Called by MenuEngine when a component interaction arrives whose
   * customId parses to this session.
   */
  handleExternalInteraction(interaction: MessageComponentInteraction): void {
    // This is used by the engine for routing — the actual processing
    // happens in the main loop via awaitMessageComponent.
    // For now, external routing defers to the collector pattern.
    // The engine will call this when it intercepts interactions
    // that match this session's ID.
    void interaction;
  }

  // -----------------------------------------------------------------------
  // Main interaction loop
  // -----------------------------------------------------------------------

  /**
   * The core event loop. Processes menus until the session ends.
   *
   * Flow per iteration:
   * 1. beforeRender hook
   * 2. Run definition setters (embeds/buttons/layout) + build payload
   * 3. Send or update the Discord message
   * 4. afterRender hook
   * 5. Await interaction (component / message / modal race)
   * 6. Dispatch: reserved button → session method, custom → action callback
   * 7. onAction hook (for custom actions)
   * 8. If navigated → loop continues with new menu's enter+render
   * 9. If not navigated → auto-refresh (re-run setters, update message)
   */
  private async processMenus(): Promise<void> {
    const timeout = this._engine.timeout;

    while (!this._isCancelled && !this._isCompleted) {
      if (!this._currentMenu) break;

      // Reset navigation flags
      this._didNavigate = false;
      this._didHardRefresh = false;

      // --- Pending modal (action triggered openModal in previous iteration) ---
      // The interaction that triggered the modal already called showModal(),
      // so we skip rendering and go straight to awaiting the modal submit.
      if (this._currentMenu.isModalActive && this._currentMenu.activeModal) {
        const outcome = await this.awaitModalInteraction(timeout);
        if (this._isCancelled || this._isCompleted) break;
        if (this._didNavigate) continue;
        if (outcome === 'timeout') break;
        continue; // Re-render after modal outcome
      }

      // --- Render cycle ---
      await this.renderCurrentMenu();

      // Check if the session ended during rendering (e.g., onEnter navigated away)
      if (this._isCancelled || this._isCompleted) break;
      if (this._didNavigate) continue; // Navigation happened during hooks

      // --- Await interaction ---
      const responseType = this._currentMenu.getResponseType();

      if (responseType === 'message') {
        await this.awaitMessageReply(timeout);
      } else if (responseType === 'mixed') {
        await this.awaitMixedInteraction(timeout);
      } else {
        await this.awaitComponentInteraction(timeout);
      }

      // Check exit conditions after interaction
      if (this._isCancelled || this._isCompleted) break;
      if (this._didNavigate) continue;

      // --- Auto-refresh (action stayed on same menu) ---
      if (this._didHardRefresh) continue; // hardRefresh already replaced the menu, re-render from top
    }
  }

  /**
   * Execute a full render cycle for the current menu.
   */
  private async renderCurrentMenu(): Promise<void> {
    if (!this._currentMenu) return;

    const ctx = this.buildContext(this._currentMenu);

    // beforeRender hook
    await this._lifecycleManager.emit(
      'beforeRender',
      ctx,
      this._currentMenu.definition.hooks
    );

    // Delegate to renderer (calls setters, builds payload, sends message)
    await this._renderer.render(
      this._currentMenu,
      ctx,
      this._commandInteraction
    );

    // afterRender hook
    await this._lifecycleManager.emit(
      'afterRender',
      ctx,
      this._currentMenu.definition.hooks
    );
  }

  // -----------------------------------------------------------------------
  // Interaction collection
  // -----------------------------------------------------------------------

  /**
   * Await a component interaction (button or select menu click).
   */
  private async awaitComponentInteraction(timeout: number): Promise<void> {
    if (!this._renderer['_activeMessage']) return;

    try {
      const interaction = await this._renderer[
        '_activeMessage'
      ].awaitMessageComponent({
        filter: (i) => i.user.id === this._commandInteraction.user.id,
        time: timeout,
      });

      this._renderer.setLastComponentInteraction(interaction);
      await this.handleComponentInteraction(interaction);
    } catch (error) {
      // awaitMessageComponent rejects on timeout with a specific collector error.
      // Re-throw real errors so they aren't silently swallowed.
      const isTimeout =
        error instanceof Error &&
        (error.message.includes('time') || error.message.includes('Collector'));
      if (isTimeout) {
        this._isCompleted = true;
      } else {
        throw error;
      }
    }
  }

  /**
   * Await a text message reply.
   */
  private async awaitMessageReply(timeout: number): Promise<void> {
    const channel = this._commandInteraction.channel;
    if (!channel || !('awaitMessages' in channel)) return;

    try {
      const collected = await channel.awaitMessages({
        filter: (msg) => msg.author.id === this._commandInteraction.user.id,
        max: 1,
        time: timeout,
        errors: ['time'],
      });

      const message = collected.first();
      if (!message || !this._currentMenu) return;

      // Delete the user's message for clean UX (best-effort)
      try {
        await message.delete();
      } catch {
        // May not have permissions
      }

      this._renderer.setResetFlag();

      const ctx = this.buildContext(this._currentMenu);
      if (this._currentMenu.definition.handleMessage) {
        await this._currentMenu.definition.handleMessage(ctx, message.content);
      }
    } catch {
      // Timeout
      this._isCompleted = true;
    }
  }

  /**
   * Await either a component interaction or a message reply (mixed mode).
   * Races both collectors — first to resolve wins.
   */
  private async awaitMixedInteraction(timeout: number): Promise<void> {
    const channel = this._commandInteraction.channel;
    const activeMessage = this._renderer['_activeMessage'] as Message | null;
    if (!channel || !('awaitMessages' in channel) || !activeMessage) return;

    const userId = this._commandInteraction.user.id;

    const result = await new Promise<{
      type: 'component' | 'message';
      value?: string;
      interaction?: MessageComponentInteraction;
    }>((resolve, reject) => {
      let settled = false;
      let failCount = 0;
      const totalListeners = 2;

      const onFail = () => {
        failCount++;
        if (failCount >= totalListeners) {
          reject(new Error('timeout'));
        }
      };

      // Component listener
      activeMessage
        .awaitMessageComponent({
          filter: (i) => i.user.id === userId,
          time: timeout,
        })
        .then((interaction) => {
          if (settled) return;
          settled = true;
          resolve({ type: 'component', interaction });
        })
        .catch(() => {
          if (!settled) onFail();
        });

      // Message listener
      channel
        .awaitMessages({
          filter: (msg) => msg.author.id === userId,
          max: 1,
          time: timeout,
          errors: ['time'],
        })
        .then((collected) => {
          if (settled) return;
          settled = true;
          const msg = collected.first();
          resolve({ type: 'message', value: msg?.content });
        })
        .catch(() => {
          if (!settled) onFail();
        });
    }).catch(() => null);

    if (!result) {
      this._isCompleted = true;
      return;
    }

    if (result.type === 'component' && result.interaction) {
      this._renderer.setLastComponentInteraction(result.interaction);
      await this.handleComponentInteraction(result.interaction);
    } else if (
      result.type === 'message' &&
      result.value !== undefined &&
      this._currentMenu
    ) {
      this._renderer.setResetFlag();

      const ctx = this.buildContext(this._currentMenu);
      if (this._currentMenu.definition.handleMessage) {
        await this._currentMenu.definition.handleMessage(ctx, result.value);
      }
    }
  }

  /**
   * Await a modal interaction — races modal submit against component/message
   * interactions (user might dismiss the modal and click a button instead).
   */
  private async awaitModalInteraction(
    timeout: number
  ): Promise<'modal' | 'component' | 'message' | 'timeout'> {
    if (!this._currentMenu) return 'timeout';

    const userId = this._commandInteraction.user.id;
    const channel = this._commandInteraction.channel;
    const activeMessage = this._renderer['_activeMessage'] as Message | null;
    const responseType = this._currentMenu.getResponseType();

    const result = await new Promise<{
      type: 'modal' | 'component' | 'message';
      modalInteraction?: ModalSubmitInteraction;
      componentInteraction?: MessageComponentInteraction;
      messageContent?: string;
    }>((resolve, reject) => {
      let settled = false;
      let failCount = 0;
      let listenerCount = 1; // modal always

      const onFail = () => {
        failCount++;
        if (failCount >= listenerCount) {
          reject(new Error('timeout'));
        }
      };

      // Modal submit listener (uses the interaction that called showModal)
      const modalInteractionRef = this._modalShowInteraction;
      if (modalInteractionRef) {
        modalInteractionRef
          .awaitModalSubmit({
            filter: (i: ModalSubmitInteraction) => i.user.id === userId,
            time: timeout,
          })
          .then((modalInteraction: ModalSubmitInteraction) => {
            if (settled) return;
            settled = true;
            resolve({ type: 'modal', modalInteraction });
          })
          .catch(() => {
            if (!settled) onFail();
          });
      }

      // Component listener (if menu has components)
      if (
        activeMessage &&
        (responseType === 'component' || responseType === 'mixed')
      ) {
        listenerCount++;
        activeMessage
          .awaitMessageComponent({
            filter: (i) => i.user.id === userId,
            time: timeout,
          })
          .then((interaction) => {
            if (settled) return;
            settled = true;
            resolve({ type: 'component', componentInteraction: interaction });
          })
          .catch(() => {
            if (!settled) onFail();
          });
      }

      // Message listener (if menu has message handler)
      if (
        channel &&
        'awaitMessages' in channel &&
        (responseType === 'message' || responseType === 'mixed')
      ) {
        listenerCount++;
        channel
          .awaitMessages({
            filter: (msg) => msg.author.id === userId,
            max: 1,
            time: timeout,
            errors: ['time'],
          })
          .then((collected) => {
            if (settled) return;
            settled = true;
            const msg = collected.first();
            resolve({ type: 'message', messageContent: msg?.content });
          })
          .catch(() => {
            if (!settled) onFail();
          });
      }
    }).catch(() => null);

    if (!result) return 'timeout';

    // Clear modal state
    this._modalShowInteraction = null;
    if (this._currentMenu) {
      this._currentMenu.isModalActive = false;
    }

    if (result.type === 'modal' && result.modalInteraction) {
      // Handle modal submission
      await this.handleModalSubmit(result.modalInteraction);
      return 'modal';
    } else if (result.type === 'component' && result.componentInteraction) {
      this._renderer.setLastComponentInteraction(result.componentInteraction);
      await this.handleComponentInteraction(result.componentInteraction);
      return 'component';
    } else if (
      result.type === 'message' &&
      result.messageContent !== undefined &&
      this._currentMenu
    ) {
      this._renderer.setResetFlag();
      const ctx = this.buildContext(this._currentMenu);
      if (this._currentMenu.definition.handleMessage) {
        await this._currentMenu.definition.handleMessage(
          ctx,
          result.messageContent
        );
      }
      return 'message';
    }

    return 'timeout';
  }

  // -----------------------------------------------------------------------
  // Interaction dispatch
  // -----------------------------------------------------------------------

  /**
   * Handle a component interaction (button click or select menu).
   * Parses the namespaced customId, checks for reserved buttons,
   * then dispatches to the action registered in the menu instance.
   */
  private async handleComponentInteraction(
    interaction: MessageComponentInteraction
  ): Promise<void> {
    if (!this._currentMenu) return;

    // Track the latest interaction so ctx.interaction stays current
    this._latestInteraction = interaction as Interaction;

    const parsed = ComponentIdManager.parse(interaction.customId);
    if (!parsed) return;

    const componentId = parsed.componentId;

    // Determine if this button is a declarative modal trigger (opensModal).
    // Modal triggers must NOT be deferred — showModal() requires a raw interaction.
    // All other component interactions are auto-deferred so consumer actions
    // never need to worry about Discord's 3-second acknowledgement deadline.
    const isModalButton = this._currentMenu.isModalButton(componentId);

    if (!isModalButton && !interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate();
      this._renderer['_lastComponentInteraction'] = null;
    }

    // --- Reserved button handling ---
    if (componentId === '__reserved_back') {
      await this.goBack(this._completionResult);
      this._completionResult = undefined;
      return;
    }

    if (componentId === '__reserved_cancel') {
      await this.cancel();
      return;
    }

    if (componentId === '__reserved_next') {
      await this.handlePaginationNext();
      return;
    }

    if (componentId === '__reserved_previous') {
      await this.handlePaginationPrevious();
      return;
    }

    // --- Select menu handling (pass selected values to onSelect) ---
    if (interaction.isAnySelectMenu()) {
      const onSelect = this._currentMenu.activeSelect?.onSelect;
      if (!onSelect) return;

      const ctx = this.buildContext(this._currentMenu);

      await this._lifecycleManager.emit(
        'onAction',
        ctx,
        this._currentMenu.definition.hooks
      );

      try {
        await onSelect(ctx, interaction.values);
      } catch (error) {
        if (error instanceof GuardFailedError) {
          ctx.state.set('__guardMessage', error.message);
          return;
        }
        throw error;
      }
      return;
    }

    // --- Custom action dispatch (buttons) ---
    const action = this._currentMenu.resolveAction(componentId);
    if (!action) return;

    const ctx = this.buildContext(this._currentMenu);

    // onAction hook fires before the action itself
    await this._lifecycleManager.emit(
      'onAction',
      ctx,
      this._currentMenu.definition.hooks
    );

    // Modal trigger buttons: look up the target modal and show it
    // on the raw (non-deferred) interaction.
    if (isModalButton) {
      const modalId = this._currentMenu.getModalIdForButton(componentId);
      if (modalId) {
        // Sets _activeModal and _isModalActive on the instance
        await this._currentMenu.openModal(modalId);
        const modal = this._currentMenu.activeModal;
        if (modal) {
          await interaction.showModal(modal.builder);
          this._modalShowInteraction = interaction;
          this._renderer['_lastComponentInteraction'] = null;
          return;
        }
      }
    }

    await this.executeAction(action, ctx);

    // Legacy openModal() action support: if the action set isModalActive,
    // show the modal. The openModal() builtin knows how to look up the
    // correct modal from the map and set _activeModal.
    if (this._currentMenu.isModalActive && this._currentMenu.activeModal) {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.showModal(this._currentMenu.activeModal.builder);
        this._modalShowInteraction = interaction;
        this._renderer['_lastComponentInteraction'] = null;
      } else {
        console.warn(
          `[FlowCord] Button "${componentId}" used openModal() action but was auto-deferred. ` +
            `Use opensModal: true on the ButtonConfig instead.`
        );
        this._currentMenu.isModalActive = false;
      }
    }
  }

  /**
   * Handle a modal submission.
   */
  private async handleModalSubmit(
    interaction: ModalSubmitInteraction
  ): Promise<void> {
    if (!this._currentMenu) return;

    // Track the latest interaction so ctx.interaction stays current
    this._latestInteraction = interaction as Interaction;

    // Defer the modal's reply so it doesn't timeout
    await interaction.deferUpdate();

    const modalConfig = this._currentMenu.activeModal;
    if (!modalConfig?.onSubmit) return;

    const ctx = this.buildContext(this._currentMenu);
    await modalConfig.onSubmit(ctx, interaction.fields);
  }

  /**
   * Execute an action with guard error handling and auto-refresh.
   */
  private async executeAction(action: Action, ctx: MenuContext): Promise<void> {
    try {
      await action(ctx);
    } catch (error) {
      if (error instanceof GuardFailedError) {
        // Show the guard's message as a prompt on the current menu state
        ctx.state.set('__guardMessage', error.message);
        return; // Auto-refresh will show the updated state
      }
      throw error;
    }
  }

  // -----------------------------------------------------------------------
  // Pagination
  // -----------------------------------------------------------------------

  private async handlePaginationNext(): Promise<void> {
    if (!this._currentMenu?.paginationState) return;
    const ps = this._currentMenu.paginationState;
    if (ps.currentPage < ps.totalPages - 1) {
      this._currentMenu.paginationState = {
        ...ps,
        currentPage: ps.currentPage + 1,
      };
    }

    const ctx = this.buildContext(this._currentMenu);
    await this._lifecycleManager.emit(
      'onNext',
      ctx,
      this._currentMenu.definition.hooks
    );
  }

  private async handlePaginationPrevious(): Promise<void> {
    if (!this._currentMenu?.paginationState) return;
    const ps = this._currentMenu.paginationState;
    if (ps.currentPage > 0) {
      this._currentMenu.paginationState = {
        ...ps,
        currentPage: ps.currentPage - 1,
      };
    }

    const ctx = this.buildContext(this._currentMenu);
    await this._lifecycleManager.emit(
      'onPrevious',
      ctx,
      this._currentMenu.definition.hooks
    );
  }

  // -----------------------------------------------------------------------
  // Sub-menu continuations
  // -----------------------------------------------------------------------

  /**
   * Execute registered continuations when returning from a sub-menu.
   */
  private async executeContinuations(
    completedMenuName: string,
    result: unknown,
    ctx: MenuContext
  ): Promise<void> {
    const idx = this._continuations.findIndex(
      (c) => c.menuName === completedMenuName
    );
    if (idx === -1) return;

    const continuation = this._continuations.splice(idx, 1)[0];
    await continuation.onComplete(ctx, result ?? this._completionResult);
    this._completionResult = undefined;
  }

  // -----------------------------------------------------------------------
  // Context building
  // -----------------------------------------------------------------------

  /**
   * Build a MenuContext for the current menu instance.
   * All navigation methods are arrow functions to avoid `this` aliasing.
   */
  private buildContext(menuInstance: MenuInstance): MenuContext {
    const baseCtx: MenuContext = {
      session: this,
      menu: menuInstance,
      state: menuInstance.stateAccessor,
      sessionState: this.sessionState,
      client: this.client,
      interaction: this._latestInteraction,
      options: (this._currentOptions ?? {}) as Record<string, unknown>,
      pagination: menuInstance.paginationState,
      env: 'discord',

      goTo: async (menuId: string, options?: Record<string, unknown>) => {
        await this.navigateTo(menuId, options);
      },
      navigateTo: async (menuId: string, options?: Record<string, unknown>) => {
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
      openSubMenu: async (menuId: string, opts: SubMenuOptions) => {
        await this.openSubMenu(menuId, opts);
      },
      complete: async (result?: unknown) => {
        this.complete(result);
      },
    };

    // Apply context extensions (e.g., AdminMenuBuilder adds ctx.admin)
    let extendedCtx = baseCtx;
    for (const extension of menuInstance.definition.contextExtensions) {
      const extra = extension(baseCtx);
      extendedCtx = Object.assign(extendedCtx, extra);
    }

    return extendedCtx;
  }
}
