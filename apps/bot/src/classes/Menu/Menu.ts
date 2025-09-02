import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  Collection,
  type EmbedBuilder,
  type Message,
  type MessageActionRowComponentBuilder,
} from 'discord.js';

import type { ComponentInteraction } from '@bot/structures/interfaces';

import type { BotClient } from '../BotClient/BotClient';
import {
  MenuPaginationType,
  MenuResponseType,
  RESERVED_BUTTON_LABELS,
} from '../constants';
import { Session } from '../Session/Session';
import {
  AnySelectMenuBuilder,
  MenuBuilderOptions,
  MenuButton,
  MenuButtonConfig,
  MenuCommandOptions,
  PaginationConfig,
  PaginationState,
  SelectMenuConfig,
} from '../types';

type ReservedButtonLabels = 'Back' | 'Cancel' | 'Next' | 'Previous';

export class Menu<C extends MenuCommandOptions = MenuCommandOptions> {
  private _reservedButtons: Collection<
    ReservedButtonLabels,
    { label: string; style: ButtonStyle }
  > = new Collection();
  private _buttons: Collection<string, MenuButton> = new Collection();
  private _client: BotClient;
  private _interaction: ChatInputCommandInteraction | ComponentInteraction;
  private _commandOptions: C;
  private _components: ActionRowBuilder<MessageActionRowComponentBuilder>[] =
    [];
  private _content?: string;
  private _description = '';
  private _embeds: EmbedBuilder[] = [];
  private _info = '';
  private _isRootMenu = true;
  private _isTrackedInHistory: boolean;
  private _message?: Message;
  private _name: string;
  private _paginationConfig: PaginationConfig;
  private _paginationState: PaginationState = {
    endIndex: 1,
    page: 1,
    quantity: 1,
    range: '1',
    startIndex: 1,
    total: 1,
  };
  private _prompt = '';
  private _responseType: MenuResponseType;
  private _selectMenu?: SelectMenuConfig;
  private _session: Session;
  private _thumbnail?: string;

  protected _handleMessage?: (menu: Menu, response: string) => Promise<void>;
  protected _setButtons?: (menu: Menu) => Promise<MenuButtonConfig[]>;
  protected _setSelectMenu?: (menu: Menu) => SelectMenuConfig;
  protected _setEmbeds: (menu: Menu) => Promise<EmbedBuilder[]>;
  protected _onComplete?: (menu: Menu, result: unknown) => Promise<void>;

  /**** Constructor ****/

  public constructor(
    session: Session,
    name: string,
    options: MenuBuilderOptions<Menu<C>, C>
  ) {
    this._name = name;
    this._session = session;
    this._client = session.client;
    this._interaction = session.lastInteraction;

    this._commandOptions = options.commandOptions;
    this._isTrackedInHistory = options.isTrackedInHistory;
    this._paginationConfig = options.paginationConfig;
    this._reservedButtons = options.reservedButtons;
    this._responseType = options.responseType;
    this._handleMessage = options.handleMessage;
    this._setButtons = options.setButtons;
    this._setSelectMenu = options.setSelectMenu;
    this._setEmbeds = options.setEmbeds;
    this._onComplete = options.onComplete;
  }

  /**** Getters/Setters ****/

  get client(): BotClient {
    return this._client;
  }

  get commandOptions(): C {
    return this._commandOptions;
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
    return this._paginationState.page;
  }

  set currentPage(currentPage: number) {
    this._paginationState = {
      ...this._paginationState,
      page: currentPage,
    };

    // this.updatePagination();
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

  get interaction(): ChatInputCommandInteraction | ComponentInteraction {
    return this._interaction;
  }

  get isTrackedInHistory(): boolean {
    return this._isTrackedInHistory;
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

  get name(): string {
    return this._name;
  }

  get paginationConfig(): PaginationConfig {
    return this._paginationConfig;
  }

  get paginationState(): PaginationState {
    return this._paginationState;
  }

  get prompt(): string {
    return this._prompt;
  }

  set prompt(prompt: string) {
    this._prompt = prompt;
    this.setDescription();
  }

  get responseType(): MenuResponseType {
    return this._responseType;
  }

  get session(): Session {
    return this._session;
  }

  get thumbnail(): string | undefined {
    return this._thumbnail;
  }

  set thumbnail(thumbnail: string | undefined) {
    this._thumbnail = thumbnail;
  }

  /**** Public Methods ****/

  public getResponseOptions() {
    return {
      components: this.components,
      content: this.content,
      embeds: this.embeds,
    };
  }

  public async refreshButtons() {
    const buttons = await this._setButtons(this);

    this._buttons.clear();

    buttons.forEach((button: MenuButtonConfig, index: number) => {
      if (RESERVED_BUTTON_LABELS.includes(button.label)) {
        throw new Error(`Button label '${button.label}' is reserved.`);
      }

      const buttonId = button.id?.toString() ?? button.label;
      this._buttons.set(buttonId, {
        component: new ButtonBuilder()
          .setCustomId(`${this._name}_${buttonId}`)
          .setLabel(button.label)
          .setStyle(button.style),
        fixedPosition: button.fixedPosition,
        onClick: button.onClick,
        ordinal: index,
      });
    });

    this.validateButtonPaginationOptions();
  }

  public refreshSelectMenu() {
    this._selectMenu = this._setSelectMenu(this);

    const actionRow = new ActionRowBuilder<AnySelectMenuBuilder>();
    actionRow.addComponents(this._selectMenu.builder);

    this.components = [actionRow];
  }

  public async refresh() {
    if (this._setButtons) {
      await this.refreshButtons();
    }

    if (this._setSelectMenu) {
      this.refreshSelectMenu();
    }

    await this.updatePagination();

    this._embeds = await this._setEmbeds(this);
  }

  /**
   * Hard refresh - completely recreate the menu from scratch
   * This is useful when the menu's structure needs to change significantly
   */
  public async hardRefresh(): Promise<void> {
    await this._session.hardRefresh();
  }

  public async handleButtonInteraction(buttonId: string) {
    const button = this._buttons.get(buttonId);

    if (!button) {
      throw new Error(`Button with ID '${buttonId}' not found.`);
    }

    if (button.onClick) {
      await button.onClick(this);
    } else {
      throw new Error(`No action defined for button with ID '${buttonId}'.`);
    }
  }

  public async handleSelectMenuInteraction(values: string[]) {
    if (this._selectMenu) {
      await this._selectMenu.onSelect?.(this, values);
    } else {
      throw new Error('No select menu handler defined for this menu.');
    }
  }

  public async handleMessageResponse(response: string) {
    if (this._handleMessage) {
      await this._handleMessage(this, response);
    } else {
      throw new Error('No message handler defined for this menu.');
    }
  }

  /**
   * Trigger the completion handler for this menu
   */
  public async complete(result?: unknown): Promise<void> {
    // Store the completion result in session state for continuation callbacks
    if (result !== undefined) {
      this._session.setMenuCompletionState(this._name, result);
    }

    if (this._onComplete) {
      await this._onComplete(this, result);
    }
  }

  /**** Private Methods ****/

  private createDefaultButton(buttonType: ReservedButtonLabels): ButtonBuilder {
    const button = this._reservedButtons.get(buttonType);
    return new ButtonBuilder()
      .setCustomId(`${this._name}_${buttonType}`)
      .setLabel(button?.label ?? buttonType)
      .setStyle(button?.style ?? ButtonStyle.Primary);
  }

  private paginateButtons = () => {
    const sortedButtons = this._buttons.sort((a, b) => a.ordinal - b.ordinal);
    const buttonList = sortedButtons
      .filter((button) => !button.fixedPosition)
      .map((button) => button.component);
    const { page } = this._paginationState;
    const fixedStartButtons = sortedButtons
      .filter((button) => button.fixedPosition === 'start')
      .map((button) => button.component);
    const fixedEndButtons = sortedButtons
      .filter((button) => button.fixedPosition === 'end')
      .map((button) => button.component);

    const buttonSlotCount =
      10 -
      fixedStartButtons.length -
      fixedEndButtons.length -
      (this._reservedButtons.get('Back') ? 1 : 0) -
      (this._reservedButtons.get('Cancel') ? 1 : 0);

    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    let pageCount = 1,
      isFirstPage: boolean,
      isLastPage: boolean;
    if (this._buttons.size <= buttonSlotCount) {
      pageCount = 1;
      isFirstPage = true;
      isLastPage = true;
    } else if (this._buttons.size <= 2 * buttonSlotCount - 2) {
      pageCount = 2;
      isFirstPage = page === 1 ? true : false;
      isLastPage = !isFirstPage;
    } else {
      pageCount =
        Math.ceil(
          (this._buttons.size - 2 * (buttonSlotCount - 1)) /
            (buttonSlotCount - 2)
        ) + 2;
      isFirstPage = page === 1 ? true : false;
      isLastPage = page === pageCount ? true : false;
    }

    if (page > pageCount) {
      throw new Error(
        'Button page specified is greater than the number of pages.'
      );
    }

    const currentPageButtons = [...fixedStartButtons];

    const filteredButtons = [];
    let startIndex = 0,
      endIndex = 0;
    buttonList.forEach((button, index) => {
      if (
        (isFirstPage && isLastPage) ||
        (isFirstPage && index + 1 <= buttonSlotCount - 1) ||
        (isLastPage &&
          index + 1 >
            buttonSlotCount - 1 + (pageCount - 2) * (buttonSlotCount - 2)) ||
        (index + 1 > buttonSlotCount - 1 + (page - 2) * (buttonSlotCount - 2) &&
          index + 1 <= buttonSlotCount - 1 + (page - 1) * (buttonSlotCount - 2))
      ) {
        if (filteredButtons.length === 0) {
          startIndex = index;
        }
        filteredButtons.push(button);
        endIndex = index;
      }
    });
    currentPageButtons.push(...filteredButtons);

    this._paginationState = {
      ...this._paginationState,
      endIndex: endIndex,
      quantity: endIndex - startIndex + 1,
      range:
        startIndex === endIndex
          ? `${startIndex + 1}`
          : `${startIndex + 1}-${endIndex + 1}`,
      startIndex: startIndex,
      total: buttonList.length,
    };

    if (pageCount > 1 && !isFirstPage) {
      const prevBtn = this.createDefaultButton('Previous');
      currentPageButtons.push(prevBtn);
    }

    if (pageCount > 1 && !isLastPage) {
      const nextBtn = this.createDefaultButton('Next');
      currentPageButtons.push(nextBtn);
    }

    if (fixedEndButtons) {
      currentPageButtons.push(...fixedEndButtons);
    }

    if (this._reservedButtons.get('Back') && this.session.history.length > 0) {
      currentPageButtons.push(this.createDefaultButton('Back'));
    }

    if (this._reservedButtons.get('Cancel')) {
      currentPageButtons.push(this.createDefaultButton('Cancel'));
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

    this.components = components;
  };

  private async paginateList() {
    let showNextButton = false;
    let showPreviousButton = false;

    const { itemsPerPage, getItemTotal } = this._paginationConfig;

    const startIndex: number = (this.currentPage - 1) * itemsPerPage;
    const itemTotal = await getItemTotal(this);

    let endIndex: number = itemsPerPage * this.currentPage - 1;
    endIndex = endIndex > itemTotal ? itemTotal - 1 : endIndex;

    this._paginationState = {
      ...this._paginationState,
      endIndex: endIndex,
      quantity: endIndex - startIndex + 1,
      range:
        startIndex === endIndex
          ? `${startIndex + 1}`
          : `${startIndex + 1}-${endIndex + 1}`,
      startIndex: startIndex,
      total: itemTotal,
    };

    const totalPages = Math.ceil(
      itemTotal / this._paginationConfig.itemsPerPage
    );

    if (totalPages > 1 && this.currentPage < totalPages) {
      showNextButton = true;
    }
    if (this.currentPage > 1) {
      showPreviousButton = true;
    }

    const actionRow = new ActionRowBuilder<ButtonBuilder>();

    if (showPreviousButton && this._reservedButtons.get('Previous')) {
      actionRow.addComponents(this.createDefaultButton('Previous'));
    }

    if (showNextButton && this._reservedButtons.get('Next')) {
      actionRow.addComponents(this.createDefaultButton('Next'));
    }

    if (this._reservedButtons.get('Back')) {
      actionRow.addComponents(this.createDefaultButton('Back'));
    }

    if (this._reservedButtons.get('Cancel')) {
      actionRow.addComponents(this.createDefaultButton('Cancel'));
    }

    if (actionRow.components.length > 0) {
      this.components = [actionRow];
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

  private async updatePagination() {
    if (
      this._paginationConfig.type === MenuPaginationType.BUTTONS &&
      (this._buttons.size > 0 || this._reservedButtons.size > 0)
    ) {
      this.paginateButtons();
    } else if (this._paginationConfig.type === MenuPaginationType.LIST) {
      await this.paginateList();
    }
  }

  private validateButtonPaginationOptions() {
    const reservedButtonCount = this._reservedButtons.size;
    const fixedButtonCount = this._buttons.filter(
      (button) => button.fixedPosition !== undefined
    ).size;
    const availableButtonSlotsPerPage =
      this.paginationConfig.itemsPerPage -
      (reservedButtonCount + fixedButtonCount);

    if (reservedButtonCount + fixedButtonCount > 10) {
      throw new Error(
        `Too many default and fixed buttons defined (>10), not enough slots for paginating custom buttons.`
      );
    }

    if (availableButtonSlotsPerPage < 1) {
      throw new Error(
        `With current default and fixed buttons, cannot set less than ${
          reservedButtonCount + fixedButtonCount + 1
        } buttons per page to paginate`
      );
    }
  }
}
