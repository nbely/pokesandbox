/**
 * MenuEngine — Core engine for the FlowCord framework.
 *
 * Holds registries, creates sessions,
 * handles interaction entry, and tracks active sessions for routing.
 */
import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  type MessageComponentInteraction,
} from 'discord.js';
import type { FlowCordClient } from '../FlowCordClient';
import type { CreateMenuDefinitionFn } from '../registry/MenuRegistry';
import { MenuRegistry } from '../registry/MenuRegistry';
import { ActionRegistry } from '../registry/ActionRegistry';
import { HookRegistry } from '../registry/HookRegistry';
import { NavigationTracer } from '../tracing/NavigationTracer';
import { ComponentIdManager } from '../components/ComponentIdManager';
import { MenuSession } from './MenuSession';

export interface MenuEngineConfig {
  /** The Discord.js client */
  client: FlowCordClient;
  /** Error handler for session errors */
  onError?: (session: MenuSession, error: unknown) => Promise<void>;
  /** Session timeout in ms (default: 120000) */
  timeout?: number;
  /** Enable navigation tracing (default: false) */
  enableTracing?: boolean;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'An unknown error has occurred.';
};

const buildDefaultErrorEmbed = (
  interaction: ChatInputCommandInteraction,
  error: unknown
): EmbedBuilder => {
  const errorMessage = getErrorMessage(error);

  return new EmbedBuilder()
    .setColor('DarkRed')
    .setAuthor({
      name: interaction.user.displayName,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTitle('Error')
    .setDescription(errorMessage)
    .setTimestamp();
};

const defaultOnError = async (
  interaction: ChatInputCommandInteraction,
  error: unknown
): Promise<void> => {
  const errorEmbed = buildDefaultErrorEmbed(interaction, error);

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        embeds: [errorEmbed],
        components: [],
      });
      return;
    }

    await interaction.reply({
      embeds: [errorEmbed],
      components: [],
      ephemeral: true,
    });
  } catch (discordError) {
    console.error('[FlowCord] Failed to send error response:', discordError);
  }
};

export class MenuEngine {
  readonly menuRegistry: MenuRegistry;
  readonly actionRegistry: ActionRegistry;
  readonly hookRegistry: HookRegistry;
  readonly tracer: NavigationTracer;

  private readonly _config: MenuEngineConfig;

  /** Active sessions indexed by session ID. */
  private readonly _sessions = new Map<string, MenuSession>();

  constructor(config: MenuEngineConfig) {
    this._config = config;
    this.menuRegistry = new MenuRegistry();
    this.actionRegistry = new ActionRegistry();
    this.hookRegistry = new HookRegistry();
    this.tracer = new NavigationTracer();

    if (config.enableTracing) {
      this.tracer.enable();
    }
  }

  get client(): FlowCordClient {
    return this._config.client;
  }

  get timeout(): number {
    return this._config.timeout ?? 120_000;
  }

  /** Number of currently active sessions. */
  get activeSessionCount(): number {
    return this._sessions.size;
  }

  /**
   * Register a menu definition factory.
   * @param name - Unique menu identifier
   * @param factory - Factory function that creates a MenuDefinition
   */
  registerMenu(name: string, factory: CreateMenuDefinitionFn): void {
    this.menuRegistry.register(name, factory);
  }

  /**
   * Handle an incoming slash command interaction.
   * Creates a new MenuSession and initializes it.
   */
  async handleInteraction(
    interaction: ChatInputCommandInteraction,
    menuName: string,
    options?: Record<string, unknown>
  ): Promise<void> {
    const session = this.createSession(interaction);

    try {
      await session.initialize(menuName, options);
    } catch (error) {
      this.removeSession(session.id);
      if (this._config.onError) {
        await this._config.onError(session, error);
      } else {
        await defaultOnError(interaction, error);
      }
    }
  }

  /**
   * Create a new MenuSession and register it for interaction routing.
   */
  createSession(interaction: ChatInputCommandInteraction): MenuSession {
    const session = new MenuSession(this, interaction);
    this._sessions.set(session.id, session);
    return session;
  }

  /**
   * Remove a session from the active sessions map.
   * Called by MenuSession when its loop exits.
   */
  removeSession(sessionId: string): void {
    this._sessions.delete(sessionId);
  }

  /**
   * Route an incoming component interaction to the correct active session.
   *
   * This should be called from the bot's `interactionCreate` event handler
   * for interactions whose customId contains a v2 session prefix.
   *
   * @returns true if the interaction was routed to a session, false otherwise
   */
  routeComponentInteraction(interaction: MessageComponentInteraction): boolean {
    const parsed = ComponentIdManager.parse(interaction.customId);
    if (!parsed) return false;

    const session = this._sessions.get(parsed.sessionId);
    if (!session) return false;

    session.handleExternalInteraction(interaction);
    return true;
  }

  /**
   * Check if a customId belongs to a FlowCord session.
   * Useful in the interactionCreate handler to decide routing.
   */
  isFlowCordInteraction(customId: string): boolean {
    const parsed = ComponentIdManager.parse(customId);
    if (!parsed) return false;
    return this._sessions.has(parsed.sessionId);
  }

  /**
   * Get an active session by ID (for debugging/testing).
   */
  getSession(sessionId: string): MenuSession | undefined {
    return this._sessions.get(sessionId);
  }
}
