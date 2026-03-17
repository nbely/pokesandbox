/**
 * LifecycleManager — Ordered hook emission with global + per-menu support.
 *
 * Global hooks (registered via HookRegistry) fire before menu-specific hooks.
 * All hooks are async and executed sequentially.
 */
import type { MenuContext } from '../context/MenuContext';
import type { HookFn, HookName, MenuHooks } from './hooks';

export class LifecycleManager {
  /** Global hooks that fire for ALL menus (from HookRegistry / plugins) */
  private readonly _globalHooks = new Map<HookName, HookFn[]>();

  /**
   * Register a global hook that fires for every menu.
   */
  registerGlobalHook(name: HookName, fn: HookFn): void {
    const hooks = this._globalHooks.get(name) ?? [];
    hooks.push(fn);
    this._globalHooks.set(name, hooks);
  }

  /**
   * Emit a lifecycle hook.
   * Fires global hooks first, then the menu-specific hook.
   */
  async emit(
    name: HookName,
    ctx: MenuContext,
    menuHooks?: MenuHooks
  ): Promise<void> {
    // Global hooks fire first
    const globalHooks = this._globalHooks.get(name);
    if (globalHooks) {
      for (const hook of globalHooks) {
        await hook(ctx);
      }
    }

    // Menu-specific hook
    const menuHook = menuHooks?.[name];
    if (menuHook) {
      await menuHook(ctx);
    }
  }

  /**
   * Clear all global hooks (useful for testing).
   */
  clearGlobalHooks(): void {
    this._globalHooks.clear();
  }
}
