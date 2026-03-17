/**
 * Pipeline and guard composition utilities for actions.
 *
 * Pipelines are best for reusable independent guards shared across many menus.
 * Not for data-heavy flows where TypeScript return types give natural type safety.
 *
 * @example
 * action: pipeline(
 *   requireUndeployedRegion,
 *   async (ctx) => { ... mutation logic ... },
 * )
 */
import type { Action, MenuContextLike, Awaitable } from '../types/common';

/**
 * A guard is a predicate. If it returns false (or the string is truthy),
 * the pipeline halts and the message is shown to the user.
 *
 * Generic over TCtx so that guards used within a typed builder
 * can access typed state/sessionState.
 */
export type GuardFn<TCtx = MenuContextLike> = (
  ctx: TCtx
) => Awaitable<boolean | string>;

/**
 * Create a guard action from a predicate and a failure message.
 *
 * If the predicate returns false, the guard halts the pipeline.
 * If the predicate returns a string, that string overrides the default message.
 *
 * @example
 * const requireUndeployed = guard(
 *   async (ctx) => {
 *     const region = await ctx.admin.getRegion(ctx.options.region_id);
 *     return !region.deployed;
 *   },
 *   'Cannot modify a deployed region. Undeploy it first.'
 * );
 */
export function guard<TCtx = MenuContextLike>(
  predicate: GuardFn<TCtx>,
  failureMessage: string
): Action<TCtx> {
  return async (ctx: TCtx) => {
    const result = await predicate(ctx);
    if (result === false || (typeof result === 'string' && result)) {
      const message = typeof result === 'string' ? result : failureMessage;
      throw new GuardFailedError(message);
    }
  };
}

/**
 * Compose multiple actions into a sequential pipeline.
 * If any action throws a GuardFailedError, the pipeline halts.
 *
 * @example
 * action: pipeline(
 *   requireAdmin,
 *   requireUndeployed,
 *   async (ctx) => { ... },
 * )
 */
export function pipeline<TCtx = MenuContextLike>(
  ...actions: Action<TCtx>[]
): Action<TCtx> {
  return async (ctx: TCtx) => {
    for (const action of actions) {
      await action(ctx);
    }
  };
}

/**
 * Error thrown by guards to halt a pipeline.
 * The session catches this and displays the message to the user
 * (e.g., via prompt or warning).
 */
export class GuardFailedError extends Error {
  readonly isGuardFailure = true;

  constructor(message: string) {
    super(message);
    this.name = 'GuardFailedError';
  }
}
