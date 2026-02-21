import {
  ButtonInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  Collection,
  ComponentType,
  GuildMember,
  InteractionCollector,
  Message,
  MessageComponentInteraction,
  MessageFlags,
  ModalSubmitInteraction,
} from 'discord.js';

import { buildErrorEmbed } from '@bot/embeds/errorEmbed';
import { ComponentInteraction } from '@bot/structures/interfaces';

import type { BotClient } from '../BotClient/BotClient';
import { MenuResponseType } from '../constants';
import { Menu } from '../Menu/Menu';
import type {
  MenuCommandOptions,
  ModalState,
  SessionHistoryEntry,
} from '../types';

interface SessionConstructor<T extends Session> {
  new (
    client: BotClient,
    interaction: ChatInputCommandInteraction,
    initialCommand: string
  ): T;
}

type MixedInteractionResponse = {
  type: MenuResponseType.MESSAGE | MenuResponseType.COMPONENT;
  value?: string;
};

type ResponseRecord = {
  menuName: string;
  responseType: MenuResponseType;
  response: string | string[];
};

export async function createSession<T extends Session>(
  SessionClass: SessionConstructor<T>,
  client: BotClient,
  interaction: ChatInputCommandInteraction,
  initialCommand: string
): Promise<void> {
  const session = new SessionClass(client, interaction, initialCommand);
  try {
    await session.initialize();
  } catch (error) {
    await session.handleError(error);
  }
}

export class Session {
  private _client: BotClient;
  private _commandInteraction: ChatInputCommandInteraction;
  private _componentInteraction: MessageComponentInteraction | null = null;
  private _modalSubmitInteraction: ModalSubmitInteraction | null = null;
  private _currentMenu: Menu | null = null;
  private _history: SessionHistoryEntry[] = [];
  private _initialCommand: string;
  private _isCancelled = false;
  private _isCompleted = false;
  private _isInitialized = false;
  private _isReset = false;
  private _lastInput: string | string[] | null = null;
  private _lastInteraction:
    | ChatInputCommandInteraction
    | MessageComponentInteraction
    | ModalSubmitInteraction;
  private _message?: Message;
  private _responseHistory: ResponseRecord[] = [];
  private _state: Collection<string, unknown> = new Collection();
  private _continuationCallbacks: Array<{
    targetMenuName: string;
    callback: (session: Session, result: unknown) => Promise<void>;
  }> = [];

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

  get componentInteraction(): ComponentInteraction | null {
    return this._componentInteraction;
  }

  get modalSubmitInteraction(): ModalSubmitInteraction | null {
    return this._modalSubmitInteraction;
  }

  /** Gets the current initialized menu.
   * Throws an error if the session is not initialized or no menu is available
   **/
  get currentMenu(): Menu {
    if (!this._isInitialized) {
      throw new Error('Session not initialized yet');
    }
    if (!this._currentMenu) {
      throw new Error('No current menu available');
    }
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
    | MessageComponentInteraction
    | ModalSubmitInteraction {
    return this._lastInteraction;
  }

  get lastNonModalInteraction():
    | ChatInputCommandInteraction
    | MessageComponentInteraction {
    return this._componentInteraction ?? this._commandInteraction;
  }

  get lastNonCommandInteraction():
    | MessageComponentInteraction
    | ModalSubmitInteraction
    | null {
    if (this.lastInteraction instanceof ChatInputCommandInteraction) {
      return this.componentInteraction ?? this.modalSubmitInteraction;
    } else {
      return this.lastInteraction;
    }
  }

  // Add a new menu to the session and update the current menu
  public async next(menu: Menu, options?: MenuCommandOptions) {
    if (this.currentMenu.isTrackedInHistory) {
      this._history.push({ menu: this.currentMenu, options });
    }
    this._currentMenu = menu;
    await this.currentMenu.refresh();
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

  public getLastResponseByMenu(menuName: string): ResponseRecord | undefined {
    return this._responseHistory
      ?.reverse()
      .find((record) => record.menuName === menuName);
  }

  /**
   * Set workflow state data that persists across menu transitions
   */
  public setState(key: string, value: unknown): void {
    this._state.set(key, value);
  }

  /**
   * Get workflow state data
   */
  public getState<T = unknown>(key: string): T | undefined {
    return this._state.get(key) as T | undefined;
  }

  public deleteState(key: string): void {
    this._state.delete(key);
  }

  /**
   * Get menu completion state data
   */
  public getMenuCompletionState<T = unknown>(menuName?: string): T | undefined {
    return this.getState(`completion:${menuName}`) as T | undefined;
  }

  /**
   * Set menu completion state data that persists across menu transitions
   */
  public setMenuCompletionState(menuName: string, data: unknown): void {
    this.setState(`completion:${menuName}`, data);
  }

  /**
   * Clear the menu completion state for a specific menu
   */
  public clearMenuCompletionState(menuName: string): void {
    this.deleteState(`completion:${menuName}`);
  }

  // Go back to the previous menu, if available
  public async goBack() {
    // Store completion result from the current menu before going back
    const returningMenuName = this.currentMenu.name;

    // Check if there's a completion result from the current menu
    const completionResult = this.getMenuCompletionState(returningMenuName);
    if (returningMenuName && completionResult) {
      this.clearMenuCompletionState(returningMenuName);
    }

    const lastHistoryEntry = this._history.pop();

    // First, restore the previous menu context
    if (lastHistoryEntry) {
      this._currentMenu = lastHistoryEntry.menu;
    } else {
      this._isCompleted = true;
      return; // No menu to go back to, exit early
    }

    if (returningMenuName) {
      // Now execute continuation callbacks for the submenu that just completed
      await this.executeContinuations(
        returningMenuName,
        completionResult ?? this._lastInput
      );
    }

    // If no new menu was set during continuation, refresh the current menu
    if (this.currentMenu.name === lastHistoryEntry.menu.name) {
      await this.hardRefresh();
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

    try {
      if (this.message) {
        await this.message.edit({
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
      } else {
        // If no message exists yet, send a new one
        await this.commandInteraction.editReply({
          embeds: [
            buildErrorEmbed(
              this.client,
              this.commandInteraction.member as GuildMember,
              errorMessage,
              addSupportInfo
            ),
          ],
          components: [],
        });
      }
    } catch (discordError) {
      // If Discord API call fails, log but don't throw
      console.error('Failed to send error message to user:', discordError);
    }

    this._isCancelled = true;
  }

  public async initialize(): Promise<void> {
    await this.commandInteraction.deferReply();
    const options = this.commandInteraction.options.data.reduce(
      (acc, option) => {
        acc[option.name] = option.value;
        return acc;
      },
      {} as Record<string, unknown>
    );
    const menu =
      (await this._client.slashCommands
        .get(this._initialCommand)
        ?.createMenu?.(this, options)) ?? null;
    if (!menu) {
      throw new Error(
        'Failed to create menu for command: ' + this._initialCommand
      );
    }
    await menu.refresh();
    this._currentMenu = menu;
    this._isInitialized = true;
    await this.processMenus();
  }

  /**
   * Register a continuation callback to be executed when a specific menu completes
   */
  public registerContinuation(
    targetMenuName: string,
    callback: (session: Session, result: unknown) => Promise<void>
  ): void {
    this._continuationCallbacks.push({ targetMenuName, callback });
  }

  /**
   * Execute and clear any registered continuation callbacks for the specified menu
   */
  private async executeContinuations(
    targetMenuName: string,
    result?: unknown
  ): Promise<void> {
    const continuations = this._continuationCallbacks.filter(
      (c) => c.targetMenuName === targetMenuName
    );

    // Clear the executed continuations
    this._continuationCallbacks = this._continuationCallbacks.filter(
      (c) => c.targetMenuName !== targetMenuName
    );

    // Execute all matching continuations
    for (const continuation of continuations) {
      await continuation.callback(this, result);
    }
  }

  /**
   * Completely recreate the current menu from scratch using the original command and options
   */
  public async hardRefresh(): Promise<void> {
    const currentMenuName = this.currentMenu.name;
    const currentOptions = this.currentMenu.commandOptions;

    // Recreate the menu from scratch using the original command
    const newMenu = await this._client.slashCommands
      .get(currentMenuName)
      ?.createMenu?.(this, currentOptions);

    if (!newMenu) {
      throw new Error(`Failed to recreate menu: ${currentMenuName}`);
    }

    // Replace the current menu without affecting history
    this._currentMenu = newMenu;
    await this.currentMenu.refresh();
  }

  /**** Private Methods ****/

  private async handleMessageResponse(message: string): Promise<void> {
    if (!this.currentMenu.responseType) {
      throw new Error('Current menu does not accept message responses.');
    }

    this._responseHistory.push({
      menuName: this.currentMenu.name,
      responseType: this.currentMenu.responseType,
      response: message,
    });

    await this.currentMenu.handleMessageResponse(message);
  }

  private async handleComponentInteraction(): Promise<void> {
    if (this.componentInteraction?.isButton()) {
      const buttonId = await this.handleButtonInteraction();
      if (buttonId !== undefined) {
        await this.currentMenu.handleButtonInteraction(buttonId);
      }
    } else if (this.componentInteraction?.isRoleSelectMenu()) {
      await this.handleRoleMenuInteraction();
    } else {
      await this.handleError(new Error('Invalid Component Interaction'));
    }
  }

  private async handleButtonInteraction(): Promise<string | undefined> {
    if (!this.componentInteraction?.isButton()) {
      throw new Error('There was an error processing your button interaction.');
    }
    const buttonId = this.componentInteraction.customId.split('_')[1];

    if (!buttonId) {
      throw new Error('Invalid Button Menu Interaction');
    }

    this._responseHistory.push({
      menuName: this.currentMenu.name,
      responseType: MenuResponseType.COMPONENT,
      response: buttonId,
    });

    if (buttonId === 'Back') {
      await this.goBack();
    } else if (buttonId === 'Cancel') {
      await this.cancel();
    } else if (buttonId === 'Next') {
      this.currentMenu.currentPage++;
      await this.currentMenu.refresh();
    } else if (buttonId === 'Previous') {
      this.currentMenu.currentPage--;
      await this.currentMenu.refresh();
    } else {
      this._lastInput = buttonId;
      return buttonId;
    }
  }

  private async handleRoleMenuInteraction(): Promise<void> {
    if (!this.componentInteraction?.isRoleSelectMenu()) {
      throw new Error(
        'There was an error processing your role select menu interaction.'
      );
    }
    const values = this.componentInteraction.values;
    this._responseHistory.push({
      menuName: this.currentMenu.name,
      responseType: MenuResponseType.COMPONENT,
      response: values,
    });

    await this.currentMenu.handleSelectMenuInteraction(values);
    this._lastInput = values;
  }

  private async handleModalSubmitInteraction(): Promise<void> {
    if (!this.modalSubmitInteraction) {
      throw new Error(
        'There was an error processing your modal submit interaction.'
      );
    }
    const fields = this.modalSubmitInteraction.fields;
    await this.currentMenu.handleModalSubmit(fields);
  }

  private async awaitMessageReply(time: number): Promise<string> {
    const filter = (message: Message): boolean => {
      return message.author.id === this.commandInteraction.user.id;
    };

    const channel = this.commandInteraction.channel;
    if (!channel || channel.type === ChannelType.GroupDM) {
      throw new Error('Cannot collect messages in this type of channel.');
    }

    const collectedMessage = await channel.awaitMessages({
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
      resolve: (response: MixedInteractionResponse) => void
    ) => {
      let compCollector: InteractionCollector<ButtonInteraction> | undefined;

      if (this.currentMenu.components.length > 0) {
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
      const channel = this.commandInteraction.channel;
      if (!channel || channel.type === ChannelType.GroupDM) {
        throw new Error('Cannot collect messages in this type of channel.');
      }

      const msgCollector = channel.createMessageCollector({
        filter: msgFilter,
        max: 1,
        time,
      });

      compCollector?.on('collect', async (componentInteraction) => {
        msgCollector?.stop();
        this._componentInteraction = componentInteraction;
        this._lastInteraction = componentInteraction;
        resolve({ type: MenuResponseType.COMPONENT });
      });
      compCollector?.on('end', async (collected) => {
        if (collected.size === 0) {
          if (msgCollector) {
            if (msgCollector?.ended && msgCollector?.received === 0) {
              throw new Error('No response received.');
            }
          } else {
            throw new Error('No response received.');
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
              throw new Error('No response received.');
            }
          } else {
            throw new Error('No response received.');
          }
        }
      });
    };

    return new Promise<MixedInteractionResponse>(collectMessageOrButton);
  }

  async sendEmbedMessage(): Promise<void> {
    const activeModal = this.getState<ModalState>('activeModal');
    if (
      activeModal &&
      this.currentMenu.modal &&
      activeModal.id === this.currentMenu.modal.builder.data.custom_id
    ) {
      await this.lastNonModalInteraction?.showModal(
        this.currentMenu.modal.builder
      );
    } else if (!this.message) {
      const responseOptions = this.currentMenu.getResponseOptions();
      this._message = await this.commandInteraction.followUp(responseOptions);
      // this.info = '';
    } else {
      await this.updateEmbedMessage();
    }
  }

  async updateEmbedMessage(): Promise<void> {
    if (this._isReset) {
      if (
        this.lastInteraction?.deferred === false &&
        this.lastInteraction?.replied === false
      ) {
        await this.lastInteraction.deferReply();
      }
      this._message = await this.lastInteraction?.followUp(
        this.currentMenu.getResponseOptions()
      );
      this._isReset = false;
    } else {
      if (this.lastInteraction instanceof ModalSubmitInteraction) {
        if (!this.message) {
          throw new Error('No message available to update after modal submit.');
        }
        // await this.lastInteraction.deleteReply();
        await this.message.edit(this.currentMenu.getResponseOptions());
      } else {
        await this.componentInteraction?.update(
          this.currentMenu.getResponseOptions()
        );
      }
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

    if (!this.message) {
      throw new Error(
        'No message available to collect component interactions.'
      );
    }

    const newComponentInteraction = await this.message.awaitMessageComponent({
      filter,
      time,
    });
    this._componentInteraction = newComponentInteraction;
    this._lastInteraction = newComponentInteraction;
  }

  private async awaitModalInteraction(time: number): Promise<void> {
    const filter = (interaction: ModalSubmitInteraction): boolean => {
      return (
        interaction.customId === this.currentMenu.modal?.builder.data.custom_id
      );
    };

    const newModalSubmitInteraction =
      await this.lastNonModalInteraction.awaitModalSubmit({
        filter,
        time,
      });

    await newModalSubmitInteraction.deferUpdate();

    this._modalSubmitInteraction = newModalSubmitInteraction;
    this._lastInteraction = newModalSubmitInteraction;
  }

  private async processMenus(): Promise<void> {
    while (!this._isCancelled && !this._isCompleted) {
      await this.sendEmbedMessage();
      const menuResponseType = this.currentMenu.responseType;

      const activeModal = this.getState<ModalState>('activeModal');
      if (activeModal) {
        await this.awaitModalInteraction(5_000);
        await this.handleModalSubmitInteraction();
        continue;
      }

      if (menuResponseType === MenuResponseType.MESSAGE) {
        const message = await this.awaitMessageReply(120_000);
        await this.handleMessageResponse(message);
      }

      if (menuResponseType === MenuResponseType.COMPONENT) {
        await this.awaitMenuInteraction(120_000);
        await this.handleComponentInteraction();
      }

      if (menuResponseType === MenuResponseType.MIXED) {
        const { value, type } = await this.collectMessageOrButtonInteraction(
          120_000
        );

        if (!!value && type === MenuResponseType.MESSAGE) {
          await this.handleMessageResponse(value);
        } else if (type === MenuResponseType.COMPONENT) {
          await this.handleComponentInteraction();
        }
      }
    }
  }
}
