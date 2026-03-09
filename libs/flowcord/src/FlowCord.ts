import type { ChatInputCommandInteraction } from 'discord.js';
import { defaultErrorHandler } from './errors';
import { MenuRegistry } from './registry';
import type { Session } from './session/Session';
import type { FlowCordClient } from './FlowCordClient';
import type { CreateMenuFunction } from './types';

/**
 * Configuration options for FlowCord
 */
export interface FlowCordConfig {
  /**
   * The Discord client instance (required)
   */
  client: FlowCordClient;

  /**
   * Custom error handler (optional, defaults to displaying a red error embed)
   */
  onError?: (session: Session, error: unknown) => Promise<void>;

  /**
   * Interaction timeout in milliseconds (optional, defaults to 120000ms / 2 minutes)
   */
  timeout?: number;

  /**
   * Custom Session class for advanced use cases (optional, defaults to Session)
   */
  sessionClass?: typeof Session;
}

/**
 * Main entry point for the FlowCord framework.
 * Manages menu registration and interaction dispatching.
 *
 * @example
 * ```typescript
 * const flow = new FlowCord({ client });
 * flow.registerMenu('ping', pingMenu);
 *
 * client.on('interactionCreate', (interaction) => {
 *   if (interaction.isChatInputCommand()) {
 *     flow.handleInteraction(interaction);
 *   }
 * });
 * ```
 */
export class FlowCord {
  private _client: FlowCordClient;
  private _registry: MenuRegistry;
  private _config: FlowCordConfig;

  constructor(config: FlowCordConfig) {
    this._client = config.client;
    this._registry = new MenuRegistry();
    this._config = {
      ...config,
      onError: config.onError || defaultErrorHandler,
      timeout: config.timeout || 120000, // 2 minutes default
    };
  }

  /**
   * Get the Discord client instance
   */
  get client(): FlowCordClient {
    return this._client;
  }

  /**
   * Get the menu registry
   */
  get registry(): MenuRegistry {
    return this._registry;
  }

  /**
   * Get the configuration
   */
  get config(): FlowCordConfig {
    return this._config;
  }

  /**
   * Register a menu factory function for a command name.
   * The factory function will be called when a user invokes the command.
   *
   * @param name The command name (must match the Discord slash command name)
   * @param createMenu The factory function that creates the menu instance
   *
   * @example
   * ```typescript
   * flow.registerMenu('settings', async (session) =>
   *   new MenuBuilder(session, 'settings')
   *     .setEmbeds(getSettingsEmbeds)
   *     .setButtons(getSettingsButtons)
   *     .build()
   * );
   * ```
   */
  registerMenu(name: string, createMenu: CreateMenuFunction): void {
    this._registry.register(name, createMenu);
  }

  /**
   * Handle a Discord chat input command interaction.
   * This is the primary API for FlowCord - call this from your interactionCreate event handler.
   *
   * This method:
   * 1. Looks up the menu factory by command name
   * 2. Creates a Session instance
   * 3. Initializes the session (builds menu, enters interaction loop)
   * 4. Handles any errors automatically
   *
   * @param interaction The Discord chat input command interaction
   *
   * @example
   * ```typescript
   * client.on('interactionCreate', (interaction) => {
   *   if (interaction.isChatInputCommand()) {
   *     flow.handleInteraction(interaction);
   *   }
   * });
   * ```
   */
  async handleInteraction(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const commandName = interaction.commandName;
    const menuFactory = this._registry.getMenuFactory(commandName);

    if (!menuFactory) {
      // Not a FlowCord-managed command - silently skip
      return;
    }

    // Import Session dynamically to avoid circular dependency issues during initialization
    const { Session } = await import('./session/Session');
    const SessionClass = this._config.sessionClass || Session;

    const session = new SessionClass(this, interaction, commandName);
    try {
      await session.initialize();
    } catch (error) {
      await session.handleError(error);
    }
  }
}
