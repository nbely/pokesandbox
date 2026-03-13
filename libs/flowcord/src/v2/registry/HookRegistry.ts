/**
 * HookRegistry — Plugin infrastructure for global lifecycle hooks.
 *
 * Global hooks fire for every menu, before menu-specific hooks.
 * This is the registration surface — LifecycleManager consumes these.
 */
import type { HookFn, HookName } from '../lifecycle/hooks';
import type { LifecycleManager } from '../lifecycle/LifecycleManager';

export class HookRegistry {
  private readonly _hooks = new Map<HookName, HookFn[]>();

  /** Register a global hook. */
  register(name: HookName, fn: HookFn): void {
    const hooks = this._hooks.get(name) ?? [];
    hooks.push(fn);
    this._hooks.set(name, hooks);
  }

  /** Get all hooks for a given lifecycle event. */
  getHooks(name: HookName): ReadonlyArray<HookFn> {
    return this._hooks.get(name) ?? [];
  }

  /** Clear all hooks. */
  clear(): void {
    this._hooks.clear();
  }

  /** Sync all registered hooks into a LifecycleManager. */
  applyTo(lifecycleManager: LifecycleManager): void {
    for (const [name, hooks] of this._hooks) {
      for (const hook of hooks) {
        lifecycleManager.registerGlobalHook(name, hook);
      }
    }
  }
}
