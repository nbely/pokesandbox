import {
  ActionRowBuilder,
  type ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  type ChatInputCommandInteraction,
  Collection,
  ComponentType,
  type EmbedBuilder,
  type GuildMember,
  type InteractionCollector,
  type Message,
  type MessageActionRowComponentBuilder,
  type MessageComponentInteraction,
} from 'discord.js';

import { buildErrorEmbed } from '@bot/embeds/errorEmbed';
import { Button } from '@bot/interactions/buttons/global/button';
import type { ComponentInteraction } from '@bot/structures/interfaces';

import type { BotClient } from './BotClient';

export enum MenuResponseType {
  COMPONENT,
  MESSAGE,
  MIXED,
}

export type MenuBuilderOptions = {
  backButtonLabel?: string;
  backButtonStyle?: ButtonStyle;
  cancellable?: boolean;
  cancelButtonLabel?: string;
  cancelButtonStyle?: ButtonStyle;
  responseType?: MenuResponseType;
  returnable?: boolean;
  trackInHistory?: boolean;
};

export type MenuButtonConfig = {
  disabled?: boolean;
  fixedPosition?: 'start' | 'end';
  id?: number | string;
  label: string;
  style: ButtonStyle;
  onClick?: <T extends MenuBuilder>(menu: T) => void;
};

export type MenuButton = {
  component: ButtonBuilder;
  onClick?: <T extends MenuBuilder>(menu: T) => void;
  fixedPosition?: 'start' | 'end';
  ordinal: number;
};

export type BasePaginationOptions = {
  nextButtonLabel?: string;
  nextButtonStyle?: ButtonStyle;
  previousButtonLabel?: string;
  previousButtonStyle?: ButtonStyle;
};

export type ButtonPaginationOptions = BasePaginationOptions & {
  quantityPerPage?: number;
};

export type ListPaginationOptions = BasePaginationOptions & {
  quantityPerPage: number;
  totalQuantity: number;
};

export type PaginationState = {
  currentEndIndex: number;
  currentQuantity: number;
  currentRange: number;
  currentStartIndex: number;
};

export type PaginationOptions = {
  _currentEndIndex: number;
  _currentQuantity: number;
  _currentRange: string;
  _currentStartIndex: number;
  backButtonStyle?: ButtonStyle;
  buttons?: ButtonBuilder[];
  cancelButtonStyle?: ButtonStyle;
  fixedStartButtons?: ButtonBuilder[];
  fixedEndButtons?: ButtonBuilder[];
  hideBackButton?: boolean;
  hideCancelButton?: boolean;
  nextButtonStyle?: ButtonStyle;
  previousButtonStyle?: ButtonStyle;
  quantityPerPage: number;
  totalQuantity: number;
  type: 'buttons' | 'list';
};

type ReservedButtonLabels = 'Back' | 'Cancel' | 'Next' | 'Previous';
const RESERVED_BUTTON_LABELS = ['Back', 'Cancel', 'Next', 'Previous'];

export class MenuBuilder {
  private _buttons: Collection<string, MenuButton> = new Collection();
  private _reservedButtons: Collection<
    ReservedButtonLabels,
    { label: string; style: ButtonStyle }
  > = new Collection();
  private _client: BotClient;
  private _commandInteraction: ChatInputCommandInteraction;
  private _componentInteraction?: ComponentInteraction;
  private _components: ActionRowBuilder<MessageActionRowComponentBuilder>[] =
    [];
  private _content?: string;
  private _currentPage = 1;
  private _description = '';
  private _embeds: EmbedBuilder[] = [];
  private _info = '';
  private _isBackSelected = false;
  private _isCancellable: boolean;
  private _isCancelled = false;
  private _isReset = false;
  private _isReturnable: boolean;
  private _isRootMenu = true;
  private _isTrackedInHistory: boolean;
  private _message?: Message;
  private _buttonPaginationOptions?: ButtonPaginationOptions;
  private _listPaginationOptions: ListPaginationOptions = {
    quantityPerPage: 1,
    totalQuantity: 1,
  };
  private _paginationOptions: PaginationOptions = {
    _currentEndIndex: 1,
    _currentQuantity: 1,
    _currentRange: '1',
    _currentStartIndex: 1,
    backButtonStyle: ButtonStyle.Secondary,
    buttons: [],
    cancelButtonStyle: ButtonStyle.Secondary,
    fixedStartButtons: [],
    fixedEndButtons: [],
    hideBackButton: false,
    hideCancelButton: false,
    nextButtonStyle: ButtonStyle.Primary,
    previousButtonStyle: ButtonStyle.Primary,
    quantityPerPage: 10,
    totalQuantity: 1,
    type: 'buttons',
  };
  private _paginationState: PaginationState = {
    currentEndIndex: 1,
    currentQuantity: 1,
    currentRange: 1,
    currentStartIndex: 1,
  };
  private _paginationType: 'buttons' | 'list' = 'buttons';
  private _prompt = '';
  private _responseType: MenuResponseType;
  private _thumbnail?: string;

  public constructor(
    client: BotClient,
    interaction: ChatInputCommandInteraction,
    options: MenuBuilderOptions
  ) {
    this._client = client;
    this._commandInteraction = interaction;
    this._isCancellable = options.cancellable ?? false;
    this._isReturnable = options.returnable ?? false;
    this._isTrackedInHistory = options.trackInHistory ?? true;
    this._responseType = options.responseType ?? MenuResponseType.MESSAGE;
    this._reservedButtons.set('Cancel', {
      label: options.cancelButtonLabel ?? 'Cancel',
      style: options.cancelButtonStyle ?? ButtonStyle.Secondary,
    });
    this._reservedButtons.set('Back', {
      label: options.backButtonLabel ?? 'Back',
      style: options.backButtonStyle ?? ButtonStyle.Secondary,
    });
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

  get components(): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
    return this._components;
  }

  set components(
    components: ActionRowBuilder<MessageActionRowComponentBuilder>[]
  ) {
    this._components = components;
  }

  get content(): string | undefined {
    return this._content;
  }

  set content(content: string | undefined) {
    this._content = content;
  }

  get currentPage(): number {
    return this._currentPage;
  }

  set currentPage(currentPage: number) {
    this._currentPage = currentPage;
  }

  get description(): string {
    return this._description;
  }

  get embeds(): EmbedBuilder[] {
    return this._embeds;
  }

  set embeds(embeds: EmbedBuilder[]) {
    this._embeds = embeds;
  }

  get info(): string {
    return this._info;
  }

  set info(info: string) {
    this._info = info;
    this.setDescription();
  }

  get isBackSelected(): boolean {
    return this._isBackSelected;
  }

  set isBackSelected(isBackSelected: boolean) {
    this._isBackSelected = isBackSelected;
  }

  get isCancelled(): boolean {
    return this._isCancelled;
  }

  set isCancelled(isCancelled: boolean) {
    this._isCancelled = isCancelled;
  }

  get isReset(): boolean {
    return this._isReset;
  }

  set isReset(isReset: boolean) {
    this._isReset = isReset;
  }

  get isRootMenu(): boolean {
    return this._isRootMenu;
  }

  set isRootMenu(isRootMenu: boolean) {
    this._isRootMenu = isRootMenu;
  }

  get message(): Message | undefined {
    return this._message;
  }

  set message(message: Message | undefined) {
    this._message = message;
  }

  get paginationOptions(): PaginationOptions {
    return this._paginationOptions;
  }

  set paginationOptions(paginationOptions: PaginationOptions) {
    const startIndex: number =
      (this.currentPage - 1) * paginationOptions.quantityPerPage;
    let endIndex: number = paginationOptions.quantityPerPage * this.currentPage;
    endIndex =
      endIndex > paginationOptions.totalQuantity
        ? paginationOptions.totalQuantity
        : endIndex;

    this._paginationOptions = {
      ...paginationOptions,
      _currentEndIndex: endIndex,
      _currentQuantity: endIndex - startIndex,
      _currentRange:
        startIndex === endIndex
          ? `${startIndex}`
          : `${startIndex + 1}-${endIndex}`,
      _currentStartIndex: startIndex,
    };

    if (paginationOptions.type === 'buttons') {
      this._components = this.paginateButtons(
        paginationOptions.buttons ?? [],
        this.currentPage,
        paginationOptions.fixedStartButtons,
        [
          ...(paginationOptions.fixedEndButtons ?? []),
          ...(paginationOptions.hideBackButton || this.isRootMenu
            ? []
            : [this.createDefaultButton('Back')]),
          ...(paginationOptions.hideCancelButton
            ? []
            : [this.createDefaultButton('Cancel')]),
        ]
      );
    } else {
      this.paginateList();
    }
  }

  get prompt(): string {
    return this._prompt;
  }

  set prompt(prompt: string) {
    this._prompt = prompt;
    this.setDescription();
  }

  get thumbnail(): string | undefined {
    return this._thumbnail;
  }

  set thumbnail(thumbnail: string | undefined) {
    this._thumbnail = thumbnail;
  }

  async awaitButtonMenuInteraction(time: number): Promise<string | undefined> {
    try {
      await this.awaitMenuInteraction(time);
    } catch (error) {
      await this.handleError(error);
    }
    const buttonId = this.componentInteraction?.customId.split('_')[1];
    if (buttonId !== undefined) {
      this.isRootMenu = false;
      if (buttonId === 'Back') {
        this.back();
      } else if (buttonId === 'Cancel') {
        await this.cancel();
      } else if (buttonId === 'Next') {
        this.currentPage++;
      } else if (buttonId === 'Previous') {
        this.currentPage--;
      } else {
        return buttonId;
      }
    } else {
      await this.handleError(new Error('Invalid Button Menu Interaction'));
    }
  }

  async awaitMessageReply(time: number): Promise<string> {
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
    this.isReset = true;
    return response;
  }

  async awaitRoleMenuInteraction(time: number): Promise<string> {
    await this.awaitMenuInteraction(time);
    if (this.componentInteraction?.isRoleSelectMenu()) {
      return this.componentInteraction.values[0];
    } else {
      throw new Error('Invalid Role Menu Interaction');
    }
  }

  back(): void {
    this.isBackSelected = true;
    this.prompt = '';
    this.currentPage = 1;
  }

  async cancel(): Promise<void> {
    this.components = [];
    this.content = '*Command Cancelled*';
    this.embeds = [];

    await this.componentInteraction?.update(this.getResponseOptions());
    this.isCancelled = true;
  }

  async collectMessageOrButtonInteraction(
    time: number
  ): Promise<string | undefined> {
    const collectMessageOrButton = async (
      resolve: (value: string | undefined) => void
    ) => {
      let compCollector: InteractionCollector<ButtonInteraction> | undefined;

      if (this.components.length > 0) {
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
          this.back();
        } else if (buttonId === 'Cancel') {
          await this.cancel();
        } else if (buttonId === 'Next') {
          this.currentPage++;
        } else if (buttonId === 'Previous') {
          this.currentPage--;
        } else {
          resolve(buttonId);
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
        this.isReset = true;
        resolve(message.content);
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

    return new Promise<string | undefined>(collectMessageOrButton);
  }

  private createDefaultButton(buttonType: ReservedButtonLabels): ButtonBuilder {
    const button = this._reservedButtons.get(buttonType);
    return Button.create({
      label: button?.label ?? buttonType,
      style: button?.style ?? ButtonStyle.Primary,
      id: buttonType,
    });
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
    this.isCancelled = true;
  }

  async sendEmbedMessage(): Promise<void> {
    if (!this.message) {
      this.message = await this.commandInteraction.followUp(
        this.getResponseOptions()
      );
      this.info = '';
    } else {
      await this.updateEmbedMessage();
    }
  }

  async updateEmbedMessage(): Promise<void> {
    if (this.isReset) {
      if (
        this.componentInteraction?.deferred === false &&
        this.componentInteraction?.replied === false
      ) {
        await this.componentInteraction.deferReply();
      }
      this.message =
        (await this.componentInteraction?.followUp(
          this.getResponseOptions()
        )) ??
        (await this.commandInteraction.followUp(this.getResponseOptions()));
      this.isReset = false;
    } else {
      await this.componentInteraction?.update(this.getResponseOptions());
    }
    this.info = '';
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
    this._componentInteraction = await this.message?.awaitMessageComponent({
      filter,
      time,
    });
  }

  private getResponseOptions() {
    return {
      components: this.components,
      content: this.content,
      embeds: this.embeds,
    };
  }

  private paginateButtons = (
    buttonList: ButtonBuilder[],
    page = 1,
    fixedStartButtons: ButtonBuilder[] = [],
    fixedEndButtons: ButtonBuilder[] = []
  ): ActionRowBuilder<ButtonBuilder>[] => {
    const buttonSlotCount =
      10 - fixedStartButtons.length - fixedEndButtons.length;
    if (buttonSlotCount <= 0) {
      throw new Error(
        'Too many fixed buttons! No slots for paginated buttons available.'
      );
    }
    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    let pageCount = 1,
      isFirstPage: boolean,
      isLastPage: boolean;
    if (buttonList.length <= buttonSlotCount) {
      pageCount = 1;
      isFirstPage = true;
      isLastPage = true;
    } else if (buttonList.length <= 2 * buttonSlotCount - 2) {
      pageCount = 2;
      isFirstPage = page === 1 ? true : false;
      isLastPage = !isFirstPage;
    } else {
      pageCount =
        Math.ceil(
          (buttonList.length - 2 * (buttonSlotCount - 1)) /
            (buttonSlotCount - 2)
        ) + 2;
      isFirstPage = page === 1 ? true : false;
      isLastPage = page === pageCount ? true : false;
    }

    if (page > pageCount) {
      console.error(
        'Button page specified is greater than the number of pages.'
      );
      return [];
    }
    const currentPageButtons = [...fixedStartButtons];
    currentPageButtons.push(
      ...buttonList.filter((button, index) => {
        if (
          (isFirstPage && isLastPage) ||
          (isFirstPage && index + 1 <= buttonSlotCount - 1) ||
          (isLastPage &&
            index + 1 >
              buttonSlotCount - 1 + (pageCount - 2) * (buttonSlotCount - 2)) ||
          (index + 1 >
            buttonSlotCount - 1 + (page - 2) * (buttonSlotCount - 2) &&
            index + 1 <=
              buttonSlotCount - 1 + (page - 1) * (buttonSlotCount - 2))
        )
          return true;
        else return false;
      })
    );
    if (pageCount > 1 && !isFirstPage) {
      currentPageButtons.push(this.createDefaultButton('Previous'));
    }
    if (pageCount > 1 && !isLastPage) {
      currentPageButtons.push(this.createDefaultButton('Next'));
    }

    if (fixedEndButtons) {
      currentPageButtons.push(...fixedEndButtons);
    }

    const hasSecondRow = currentPageButtons.length > 5 ? true : false;
    if (!hasSecondRow) {
      const actionRow = new ActionRowBuilder<ButtonBuilder>();
      currentPageButtons.forEach((button) => actionRow.addComponents(button));
      components.push(actionRow);
    } else {
      const firstActionRow = new ActionRowBuilder<ButtonBuilder>();
      const secondActionRow = new ActionRowBuilder<ButtonBuilder>();
      currentPageButtons.forEach((button, index) => {
        if (index < 5) {
          firstActionRow.addComponents(button);
        } else {
          secondActionRow.addComponents(button);
        }
      });
      components.push(firstActionRow, secondActionRow);
    }

    return components;
  };

  private paginateList() {
    let showNextButton = false;
    let showPreviousButton = false;

    const totalPages = Math.ceil(
      this._listPaginationOptions.totalQuantity /
        this._listPaginationOptions.quantityPerPage
    );

    if (totalPages > 1 && this.currentPage < totalPages) {
      showNextButton = true;
    }
    if (this.currentPage > 1) {
      showPreviousButton = true;
    }

    const actionRow = new ActionRowBuilder<ButtonBuilder>();

    if (showPreviousButton) {
      actionRow.addComponents(this.createDefaultButton('Previous'));
    }

    if (showNextButton) {
      actionRow.addComponents(this.createDefaultButton('Next'));
    }

    if (this._isReturnable) {
      actionRow.addComponents(this.createDefaultButton('Back'));
    }

    if (this._isCancellable) {
      actionRow.addComponents(this.createDefaultButton('Cancel'));
    }

    if (actionRow.components.length > 0) {
      this._components = [actionRow];
    }
  }

  private setDescription() {
    // set description to prompt only if info is empty
    // set descriptions to info only if prompt is empty
    // set description to prompt and info if both are not empty
    if (this.prompt && this.info) {
      this._description = `${this.prompt}\n\n${this.info}`;
    } else if (this.prompt) {
      this._description = this.prompt;
    } else if (this.info) {
      this._description = this.info;
    }
  }

  private setPaginationButtonConfigs(
    options: ButtonPaginationOptions | ListPaginationOptions
  ) {
    this._reservedButtons.set('Next', {
      label: options.nextButtonLabel ?? 'Next',
      style: options.nextButtonStyle ?? ButtonStyle.Primary,
    });

    this._reservedButtons.set('Previous', {
      label: options.previousButtonLabel ?? 'Previous',
      style: options.previousButtonStyle ?? ButtonStyle.Primary,
    });
  }

  public setButtons<T extends MenuBuilder>(
    this: T,
    components: (menu: T) => MenuButtonConfig[]
  ): T {
    const buttons = components(this);
    buttons.forEach((button: MenuButtonConfig, index: number) => {
      if (RESERVED_BUTTON_LABELS.includes(button.label)) {
        throw new Error(`Button label '${button.label}' is reserved.`);
      }

      this._buttons.set(button.label, {
        component: Button.create({
          label: button.label,
          style: button.style,
          id: button.id,
        }),
        fixedPosition: button.fixedPosition,
        onClick: button.onClick,
        ordinal: index,
      });
    });

    return this;
  }

  public setButtonPaginationOptions(options: ButtonPaginationOptions) {
    this._buttonPaginationOptions = options;
    if (this._paginationType === 'buttons') {
      this.setPaginationButtonConfigs(options);
    } else {
      throw new Error(
        'Cannot set button pagination options on a menu when list pagination is set'
      );
    }

    return this;
  }

  public setListPagination(options: ListPaginationOptions) {
    this._paginationType = 'list';
    this._listPaginationOptions = options;
    this.setPaginationButtonConfigs(options);

    return this;
  }
}
