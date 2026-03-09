import type { CreateMenuFunction } from '../types';

/**
 * Registry that maps command names to menu factory functions.
 * This replaces the tight coupling to BotClient.slashCommands.
 */
export class MenuRegistry {
  private _registry = new Map<string, CreateMenuFunction>();

  /**
   * Register a menu factory function for a command name
   * @param name The command name
   * @param factory The factory function that creates the menu
   */
  register(name: string, factory: CreateMenuFunction): void {
    this._registry.set(name, factory);
  }

  /**
   * Get the menu factory function for a command name
   * @param name The command name
   * @returns The factory function or undefined if not found
   */
  getMenuFactory(name: string): CreateMenuFunction | undefined {
    return this._registry.get(name);
  }

  /**
   * Check if a command is registered
   * @param name The command name
   * @returns True if the command is registered
   */
  has(name: string): boolean {
    return this._registry.has(name);
  }

  /**
   * Remove a registered menu
   * @param name The command name
   * @returns True if the menu was removed
   */
  unregister(name: string): boolean {
    return this._registry.delete(name);
  }

  /**
   * Get all registered command names
   */
  get commands(): string[] {
    return Array.from(this._registry.keys());
  }

  /**
   * Clear all registered menus
   */
  clear(): void {
    this._registry.clear();
  }
}
