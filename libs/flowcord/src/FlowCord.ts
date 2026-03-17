import type {
  ChatInputCommandInteraction,
  MessageComponentInteraction,
} from 'discord.js';
import { MenuEngine } from './engine/MenuEngine';
import type { MenuEngineConfig } from './engine/MenuEngine';
import type { CreateMenuDefinitionFn } from './registry/MenuRegistry';
import type { MenuSession } from './engine/MenuSession';
import type { FlowCordClient } from './FlowCordClient';

/**
 * Configuration options for FlowCord.
 */
export type FlowCordConfig = MenuEngineConfig;

/**
 * Main entry point for the FlowCord framework.
 *
 * Manages menu registration, interaction dispatching, and active session routing.
 *
 * @example
 * ```ts
 * const flowcord = new FlowCord({ client });
 * flowcord.registerMenu('server', serverMenu);
 * // In interactionCreate handler:
 * flowcord.handleInteraction(interaction, interaction.commandName);
 * ```
 */
export class FlowCord {
  private readonly _engine: MenuEngine;

  constructor(config: FlowCordConfig) {
    this._engine = new MenuEngine(config);
  }

  get client(): FlowCordClient {
    return this._engine.client;
  }

  get activeSessionCount(): number {
    return this._engine.activeSessionCount;
  }

  /**
   * Register a menu definition factory for a command name.
   */
  registerMenu(name: string, factory: CreateMenuDefinitionFn): void {
    this._engine.registerMenu(name, factory);
  }

  /**
   * Handle an incoming slash command interaction.
   */
  async handleInteraction(
    interaction: ChatInputCommandInteraction,
    menuName: string,
    options?: Record<string, unknown>
  ): Promise<void> {
    return this._engine.handleInteraction(interaction, menuName, options);
  }

  /**
   * Route an incoming component interaction to the correct active session.
   */
  routeComponentInteraction(interaction: MessageComponentInteraction): boolean {
    return this._engine.routeComponentInteraction(interaction);
  }

  /**
   * Check if a customId belongs to an active FlowCord session.
   */
  isFlowCordInteraction(customId: string): boolean {
    return this._engine.isFlowCordInteraction(customId);
  }

  /**
   * Get an active session by ID.
   */
  getSession(sessionId: string): MenuSession | undefined {
    return this._engine.getSession(sessionId);
  }
}
