import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  ComponentType,
  GuildMember,
  InteractionCollector,
  Message,
  MessageComponentInteraction,
  RoleSelectMenuInteraction,
} from 'discord.js';

import { buildErrorEmbed } from '@bot/embeds/errorEmbed';
import { ComponentInteraction } from '@bot/structures/interfaces';

import type { BotClient } from '../BotClient/BotClient';
import { MenuResponseType } from '../constants';
import { Menu } from '../Menu/Menu';
import type { SessionHistoryEntry } from '../types';

interface SessionConstructor<T extends Session> {
  new (
    client: BotClient,
    interaction: ChatInputCommandInteraction,
    initialCommand: string
  ): T;
}

type MixedInteractionResponse = {
  type: MenuResponseType.MESSAGE | MenuResponseType.COMPONENT;
  value: string;
};

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
  private _currentMenu: Menu | null = null;
  private _history: SessionHistoryEntry[] = [];
  private _initialCommand: string;
  private _isCancelled = false;
  private _isCompleted = false;
  private _isReset = false;
  private _lastInput: string | string[] | null = null;
  private _lastInteraction:
    | ChatInputCommandInteraction
    | MessageComponentInteraction;
  private _message?: Message;

  public constructor(
    client: BotClient,
    interaction: ChatInputCommandInteraction,
    initialCommand: string
  ) {
    this._client = client;
    this._commandInteraction = interaction;
    this._initialCommand = initialCommand;
    this._lastInteraction = interaction;
  }

  get client(): BotClient {
    return this._client;
  }

  get commandInteraction(): ChatInputCommandInteraction {
    return this._commandInteraction;
  }

  get componentInteraction(): ComponentInteraction | undefined {
    return this._componentInteraction;
  }

  get currentMenu(): Menu | null {
    return this._currentMenu;
  }

  get history(): SessionHistoryEntry[] {
    return this._history;
  }

  get message(): Message | undefined {
    return this._message;
  }

  get lastInput(): string | string[] | null {
    return this._lastInput;
  }

  get lastInteraction():
    | ChatInputCommandInteraction
    | MessageComponentInteraction {
    return this._lastInteraction;
  }

  // Add a new menu to the session and update the current menu
  public async next(menu: Menu, options?: string[]) {
    if (this._currentMenu.isTrackedInHistory) {
      this._history.push({ menu: this._currentMenu, options: options });
    }
    this._currentMenu = menu;
    await this._currentMenu.refresh();
  }

  async cancel(): Promise<void> {
    await this.componentInteraction?.update({
      components: [],
      content: '*Command Cancelled*',
      embeds: [],
    });
    this._isCancelled = true;
  }

  // Clear the session history
  public clearHistory(): void {
    this._history = [];
  }

  // Go back to the previous menu, if available
  public async goBack() {
    if (this._history.length > 0) {
      const lastHistoryEntry = this._history.pop();
      this._currentMenu = lastHistoryEntry.menu;
      await this._currentMenu.refresh();
    } else {
      this._isCompleted = true;
    }
  }

  public async handleError(error?: unknown): Promise<void> {
    let errorMessage = 'An unknown error has occurred!';
    let addSupportInfo = false;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      addSupportInfo = true;
    }
    await this.message?.edit({
      embeds: [
        buildErrorEmbed(
          this.client,
          (this.componentInteraction?.member ??
            this.commandInteraction.member) as GuildMember,
          errorMessage,
          addSupportInfo
        ),
      ],
      components: [],
    });
    this._isCancelled = true;
  }

  public async initialize(): Promise<void> {
    await this.commandInteraction.deferReply();
    const menu: Menu = await this._client.slashCommands
      .get(this._initialCommand)
      .createMenu(this);
    await menu.refresh();
    this._currentMenu = menu;
    await this.processMenus();
  }

  /**** Private Methods ****/

  private async handleComponentInteraction(): Promise<void> {
    if (this.componentInteraction.isButton()) {
      const buttonId = await this.handleButtonInteraction();
      if (buttonId !== undefined) {
        this._lastInput = buttonId;
        await this._currentMenu.handleButtonInteraction(buttonId);
      }
    } else if (this.componentInteraction.isRoleSelectMenu()) {
      await this.handleRoleMenuInteraction();
    } else {
      await this.handleError(new Error('Invalid Component Interaction'));
    }
  }

  private async handleButtonInteraction(): Promise<string | undefined> {
    const buttonId = this.componentInteraction?.customId.split('_')[1];

    if (buttonId !== undefined) {
      if (buttonId === 'Back') {
        await this.goBack();
      } else if (buttonId === 'Cancel') {
        await this.cancel();
      } else if (buttonId === 'Next') {
        this._currentMenu.currentPage++;
        await this._currentMenu.refresh();
      } else if (buttonId === 'Previous') {
        this._currentMenu.currentPage--;
        await this._currentMenu.refresh();
      } else {
        this._lastInput = buttonId;
        return buttonId;
      }
    } else {
      await this.handleError(new Error('Invalid Button Menu Interaction'));
    }
  }

  private async handleRoleMenuInteraction(): Promise<void> {
    const values = (this.componentInteraction as RoleSelectMenuInteraction)
      .values;
    await this._currentMenu.handleSelectMenuInteraction(values);
    this._lastInput = values;
  }

  private async awaitMessageReply(time: number): Promise<string> {
    const filter = (message: Message): boolean => {
      return message.author.id === this.commandInteraction.user.id;
    };
    const collectedMessage =
      await this.commandInteraction.channel?.awaitMessages({
        filter,
        errors: ['time'],
        max: 1,
        time,
      });

    const response: string | undefined = collectedMessage?.first()?.content;
    if (!response) {
      throw new Error('Invalid response received.');
    }
    this._isReset = true;
    this._lastInput = response;
    return response;
  }

  private async collectMessageOrButtonInteraction(
    time: number
  ): Promise<MixedInteractionResponse> {
    const collectMessageOrButton = async (
      resolve: ({ type, value }: MixedInteractionResponse | undefined) => void
    ) => {
      let compCollector: InteractionCollector<ButtonInteraction> | undefined;

      if (this._currentMenu.components.length > 0) {
        const compFilter = (
          componentInteraction: MessageComponentInteraction
        ): boolean => {
          return (
            componentInteraction.user ===
            (this.componentInteraction?.user ?? this.commandInteraction.user)
          );
        };
        compCollector = this.message?.createMessageComponentCollector({
          componentType: ComponentType.Button,
          max: 1,
          filter: compFilter,
          time,
        });
      }

      const msgFilter = (message: Message): boolean => {
        return message.author.id === this.commandInteraction.user.id;
      };
      const msgCollector =
        this.commandInteraction.channel?.createMessageCollector({
          filter: msgFilter,
          max: 1,
          time,
        });

      compCollector?.on('collect', async (componentInteraction) => {
        msgCollector?.stop();
        this._componentInteraction = componentInteraction;
        const buttonId = componentInteraction.customId.split('_')[1];
        if (buttonId === 'Back') {
          await this.goBack();
        } else if (buttonId === 'Cancel') {
          await this.cancel();
          // } else if (buttonId === 'Next') {
          //   this.currentPage++;
          // } else if (buttonId === 'Previous') {
          //   this.currentPage--;
        } else {
          resolve({ value: buttonId, type: MenuResponseType.COMPONENT });
        }
        resolve(undefined);
      });
      compCollector?.on('end', async (collected) => {
        if (collected.size === 0) {
          if (msgCollector) {
            if (msgCollector?.ended && msgCollector?.received === 0) {
              await this.handleError(new Error('No response received.'));
              resolve(undefined);
            }
          } else {
            await this.handleError(new Error('No response received.'));
            resolve(undefined);
          }
        }
      });

      msgCollector?.on('collect', async (message) => {
        compCollector?.stop();
        this._isReset = true;
        resolve({ value: message.content, type: MenuResponseType.MESSAGE });
      });
      msgCollector?.on('end', async (collected) => {
        if (collected.size === 0) {
          if (compCollector) {
            if (compCollector?.ended && compCollector?.total === 0) {
              await this.handleError(new Error('No response received.'));
              resolve(undefined);
            }
          } else {
            await this.handleError(new Error('No response received.'));
            resolve(undefined);
          }
        }
      });
    };

    return new Promise<MixedInteractionResponse | undefined>(
      collectMessageOrButton
    );
  }

  async sendEmbedMessage(): Promise<void> {
    if (!this.message) {
      this._message = await this.commandInteraction.followUp(
        this._currentMenu.getResponseOptions()
      );
      // this.info = '';
    } else {
      await this.updateEmbedMessage();
    }
  }

  async updateEmbedMessage(): Promise<void> {
    if (this._isReset) {
      if (
        this.componentInteraction?.deferred === false &&
        this.componentInteraction?.replied === false
      ) {
        await this.componentInteraction.deferReply();
      }
      this._message =
        (await this.componentInteraction?.followUp(
          this._currentMenu.getResponseOptions()
        )) ??
        (await this.commandInteraction.followUp(
          this._currentMenu.getResponseOptions()
        ));
      this._isReset = false;
    } else {
      await this.componentInteraction?.update(
        this._currentMenu.getResponseOptions()
      );
    }
  }

  private async awaitMenuInteraction(time: number): Promise<void> {
    const filter = (
      componentInteraction: MessageComponentInteraction
    ): boolean => {
      return (
        componentInteraction.user ===
        (this.componentInteraction?.user ?? this.commandInteraction.user)
      );
    };

    try {
      this._componentInteraction = await this.message?.awaitMessageComponent({
        filter,
        time,
      });
    } catch (error) {
      await this.handleError(error);
    }
  }

  private async processMenus(): Promise<void> {
    if (!this._currentMenu) return;

    while (this._currentMenu && !this._isCancelled && !this._isCompleted) {
      await this.sendEmbedMessage();
      const menuResponseType: MenuResponseType = this._currentMenu.responseType;

      if (menuResponseType === MenuResponseType.MESSAGE) {
        const message = await this.awaitMessageReply(120_000);
        await this._currentMenu.handleMessageResponse(message);
      }

      if (menuResponseType === MenuResponseType.COMPONENT) {
        await this.awaitMenuInteraction(120_000);
        await this.handleComponentInteraction();
      }

      if (menuResponseType === MenuResponseType.MIXED) {
        const { value, type } = await this.collectMessageOrButtonInteraction(
          120_000
        );
        if (value === undefined) continue;
        const handler =
          type === MenuResponseType.MESSAGE
            ? this._currentMenu.handleMessageResponse
            : this._currentMenu.handleButtonInteraction;
        await handler(value);
      }
    }
  }
}
