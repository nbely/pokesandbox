import type {
  AnySelectMenuInteraction,
  MessageComponentInteraction,
} from 'discord.js';
import type { Menu } from '../menu/Menu';
import type { Session } from '../session/Session';

/**
 * Union type for component interactions (buttons and select menus)
 */
export type ComponentInteraction =
  | MessageComponentInteraction
  | AnySelectMenuInteraction;

/**
 * Generic record type for command options passed to menus
 */
export type MenuCommandOptions = Record<string, unknown>;

/**
 * Factory function that creates a menu instance
 */
export type CreateMenuFunction<
  T extends Menu = Menu,
  TOptions extends MenuCommandOptions = MenuCommandOptions
> = (session: Session, options?: TOptions) => Promise<T>;

/**
 * Minimal command interface for FlowCord menu registration
 */
export interface FlowCordCommand<
  T extends Menu = Menu,
  TOptions extends MenuCommandOptions = MenuCommandOptions
> {
  name: string;
  createMenu: CreateMenuFunction<T, TOptions>;
}
