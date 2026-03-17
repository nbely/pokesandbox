/**
 * MenuHooks — the set of lifecycle hooks a menu can register.
 * All hooks receive the MenuContext.
 */
import type { MenuContext } from '../context/MenuContext';
import type { Awaitable } from '../types/common';

/**
 * Lifecycle hook function signature.
 */
export type HookFn<TCtx = MenuContext> = (ctx: TCtx) => Awaitable<void>;

/**
 * All available lifecycle hook names.
 */
export type HookName =
  | 'onEnter'
  | 'onLeave'
  | 'onCancel'
  | 'beforeRender'
  | 'afterRender'
  | 'onNext'
  | 'onPrevious'
  | 'onAction';

/**
 * Map of hook name → hook function.
 * All hooks are optional.
 */
export type MenuHooks<TCtx = MenuContext> = {
  [K in HookName]?: HookFn<TCtx>;
};
