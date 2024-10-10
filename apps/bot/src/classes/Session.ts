import {
  ChatInputCommandInteraction,
  MessageComponentInteraction,
} from 'discord.js';

import type { BotClient } from './BotClient';
import { MenuBuilder } from './Menu';

interface SessionConstructor<T extends Session> {
  new (
    client: BotClient,
    interaction: ChatInputCommandInteraction,
    initialCommand: string
  ): T;
}

export async function createSession<T extends Session>(
  SessionClass: SessionConstructor<T>,
  client: BotClient,
  interaction: ChatInputCommandInteraction,
  initialCommand: string
): Promise<void> {
  const session = new SessionClass(client, interaction, initialCommand);
  await session.initialize();
}

export class Session {
  private _client: BotClient;
  private _commandInteraction: ChatInputCommandInteraction;
  private _componentInteraction: MessageComponentInteraction | null = null;
  private _currentMenu: MenuBuilder | null = null;
  private _history: MenuBuilder[] = [];
  private _initialCommand: string;
  private _isCancelled = false;
  private _isCompleted = false;

  public constructor(
    client: BotClient,
    interaction: ChatInputCommandInteraction,
    initialCommand: string
  ) {
    this._client = client;
    this._commandInteraction = interaction;
    this._initialCommand = initialCommand;
  }

  get client(): BotClient {
    return this._client;
  }

  get commandInteraction(): ChatInputCommandInteraction {
    return this._commandInteraction;
  }

  get currentMenu(): MenuBuilder | null {
    return this._currentMenu;
  }

  get history(): MenuBuilder[] {
    return this._history;
  }

  // Add a new menu to the session and update the current menu
  public addMenu(menu: MenuBuilder): void {
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
  public goBack(): MenuBuilder | null {
    if (this._history.length > 1) {
      this._history.pop();
      this._currentMenu = this._history[this._history.length - 1];
      return this._currentMenu;
    }
    return null;
  }

  public async initialize(): Promise<void> {
    await this.commandInteraction.deferReply();
    const menu: MenuBuilder | undefined = await this._client.slashCommands
      .get(this._initialCommand)
      ?.createMenu(this);
    this._currentMenu = menu;
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
