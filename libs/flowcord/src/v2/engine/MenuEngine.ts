/**
 * MenuEngine — Entry point for FlowCord v2.
 *
 * Replaces FlowCord for v2 menus. Holds registries, creates sessions,
 * and handles interaction entry.
 *
 * Both v1 FlowCord and v2 MenuEngine can coexist in the same bot.
 */
import type { ChatInputCommandInteraction } from 'discord.js';
import type { FlowCordClient } from '../../FlowCordClient';
import type { CreateMenuDefinitionFn } from '../registry/MenuRegistry';
import { MenuRegistry } from '../registry/MenuRegistry';
import { ActionRegistry } from '../registry/ActionRegistry';
import { HookRegistry } from '../registry/HookRegistry';
import { NavigationTracer } from '../tracing/NavigationTracer';
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

export class MenuEngine {
  readonly menuRegistry: MenuRegistry;
  readonly actionRegistry: ActionRegistry;
  readonly hookRegistry: HookRegistry;
  readonly tracer: NavigationTracer;

  private readonly _config: MenuEngineConfig;

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
      if (this._config.onError) {
        await this._config.onError(session, error);
      } else {
        throw error;
      }
    }
  }

  /**
   * Create a new MenuSession without starting it.
   * Useful for advanced use cases or testing.
   */
  createSession(interaction: ChatInputCommandInteraction): MenuSession {
    return new MenuSession(this, interaction);
  }
}
