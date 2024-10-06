import {
  ChatInputCommandInteraction,
  MessageComponentInteraction,
} from 'discord.js';

import type { BotClient } from './BotClient';
import { Menu } from './Menu';

interface SessionConstructor<T extends Session> {
  new (
    client: BotClient,
    interaction: ChatInputCommandInteraction,
    initialMenu: Menu
  ): T;
}

export async function createSession<T extends Session>(
  SessionClass: SessionConstructor<T>,
  client: BotClient,
  interaction: ChatInputCommandInteraction,
  initialMenu?: Menu
): Promise<T> {
  const session = new SessionClass(client, interaction, initialMenu);
  await session.initialize();
  return session;
}

export class Session {
  private _client: BotClient;
  private _commandInteraction: ChatInputCommandInteraction | null = null;
  private _componentInteraction: MessageComponentInteraction | null = null;
  private _currentMenu: Menu | null = null;
  private _history: Menu[] = [];
  private _isCancelled = false;
  private _isCompleted = false;

  public constructor(
    client: BotClient,
    interaction: ChatInputCommandInteraction,
    initialMenu: Menu
  ) {
    this._client = client;
    this._commandInteraction = interaction;
    this._currentMenu = initialMenu;
  }

  get client(): BotClient {
    return this._client;
  }

  get commandInteraction(): ChatInputCommandInteraction {
    return this._commandInteraction;
  }

  get currentMenu(): Menu | null {
    return this._currentMenu;
  }

  get history(): Menu[] {
    return this._history;
  }

  // Add a new menu to the session and update the current menu
  public addMenu(menu: Menu): void {
    this._currentMenu = menu;
    this._history.push(menu);
  }

  // Clear the session history
  public clearHistory(): void {
    this._history = [];
    this._currentMenu = null;
  }

  public executeCommand(name: string): void {
    this._client.slashCommands.get(name)?.execute(this);
  }

  // Go back to the previous menu, if available
  public goBack(): Menu | null {
    if (this._history.length > 1) {
      this._history.pop();
      this._currentMenu = this._history[this._history.length - 1];
      return this._currentMenu;
    }
    return null;
  }

  public async initialize(): Promise<void> {
    await this.commandInteraction.deferReply();
    await this.processMenus();
  }

  private async processMenus(): Promise<void> {
    if (!this._currentMenu) return;

    while (this._currentMenu && !this._isCancelled && !this._isCompleted) {
      // this._currentMenu.setComponents();
      // this._currentMenu.embeds = [await this._currentMenu.getEmbed()];
      // await this._currentMenu.sendEmbedMessage();
      // if (this._currentMenu)
      //   const selection = await this._currentMenu.awaitButtonMenuInteraction(
      //     120_000
      //   );
      // if (selection === undefined) continue;
      // switch (selection) {
      //   case 'Enable':
      //   case 'Disable':
      //     this._currentMenu.prompt = `Successfully ${
      //       selection === 'Enable' ? 'enabled' : 'disabled'
      //     } Server Discovery`;
      //     this._currentMenu.server.discovery.enabled =
      //       !this._currentMenu.server.discovery.enabled;
      //     await this._currentMenu.upsertServer();
      //     break;
      //   case 'Set Description':
      //     await this.handleSetDescription();
      //     break;
      // }
    }
  }
}
