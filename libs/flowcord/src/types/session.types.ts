import type { Menu } from '../menu/Menu';
import type { MenuCommandOptions } from './interaction.types';

/**
 * Entry in the session's navigation history stack
 */
export type SessionHistoryEntry = {
  menu: Menu;
  options?: MenuCommandOptions;
};

/**
 * Callback function for menu continuation patterns
 */
export type ContinuationCallback<TResult = unknown> = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any, // Will be Session, but avoiding circular dependency in types
  result: TResult
) => Promise<void>;
