/**
 * ActionRegistry — Plugin infrastructure for named, reusable actions.
 *
 * Day-to-day code uses imported functions directly (inline actions).
 * This registry exists so plugins can register named actions for
 * string-based lookup. Designed-for, not pushed on developers.
 */
import type { Action } from '../types/common';

export class ActionRegistry {
  private readonly _actions = new Map<string, Action>();

  /** Register a named action. */
  register(name: string, action: Action): void {
    this._actions.set(name, action);
  }

  /** Get an action by name. */
  get(name: string): Action | undefined {
    return this._actions.get(name);
  }

  /** Check if an action is registered. */
  has(name: string): boolean {
    return this._actions.has(name);
  }

  /** Remove an action. */
  unregister(name: string): boolean {
    return this._actions.delete(name);
  }

  /** Clear all actions. */
  clear(): void {
    this._actions.clear();
  }
}
