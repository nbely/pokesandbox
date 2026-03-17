/**
 * Action type definition.
 *
 * An action is the unified callback contract for all interactive components.
 * Buttons, selects, and modals all use this same signature.
 */
import type { MenuContextLike, Awaitable } from '../types/common';

/**
 * The core action type. All interactive components use this.
 * Re-exported from types/common for convenience.
 */
export type { Action } from '../types/common';

/**
 * An action tagged with metadata for debugging/tracing.
 */
export interface TaggedAction {
  execute: (ctx: MenuContextLike) => Awaitable<void>;
  /** Human-readable name for tracing/debugging */
  name?: string;
  /** Type of action (builtin, inline, pipeline) */
  type: 'builtin' | 'inline' | 'pipeline';
}
