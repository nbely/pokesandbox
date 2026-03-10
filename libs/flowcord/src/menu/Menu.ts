import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  Collection,
  type EmbedBuilder,
  type Message,
  type MessageActionRowComponentBuilder,
  ModalSubmitFields,
  ModalSubmitInteraction,
} from 'discord.js';

import type { FlowCordClient } from '../FlowCordClient';
import { Session } from '../session/Session';
import {
  AnySelectMenuBuilder,
  ComponentInteraction,
  MenuBuilderOptions,
  MenuButton,
  MenuButtonConfig,
  MenuCommandOptions,
  MenuPaginationType,
  MenuResponseType,
  ModalConfig,
  ModalState,
  PaginationConfig,
  PaginationState,
  RESERVED_BUTTON_LABELS,
  SelectMenuConfig,
} from '../types';

type ReservedButtonLabels = 'Back' | 'Cancel' | 'Next' | 'Previous';

/**
 * Menu represents a single interaction step in a multi-step workflow.
 * Menus can display embeds, buttons, select menus, and modals.
 */
export class Menu<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Self extends Menu<any, any> = any,
  C extends MenuCommandOptions = MenuCommandOptions
> {
  private _reservedButtons: Collection<
    ReservedButtonLabels,
    { label: string; style: ButtonStyle }
  > = new Collection();
  private _buttons: Collection<string, MenuButton<Self>> = new Collection();
  private _client: FlowCordClient;
  private _interaction:
    | ChatInputCommandInteraction
    | ComponentInteraction
    | ModalSubmitInteraction;
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
  private _modal?: ModalConfig<Self>;
  private _name: string;
  private _paginationConfig: PaginationConfig<Self>;
  private _paginationState: PaginationState = {
    endIndex: 1,
    page: 1,
    quantity: 1,
    range: '1',
    startIndex: 1,
    total: 1,
  };
  private _prompt = '';
  private _responseType: MenuResponseType | undefined;
  private _selectMenu?: SelectMenuConfig<Self>;
  private _session: Session;
  private _thumbnail?: string;
  private _warningMessage?: string;

  protected _handleMessage?: (menu: Self, response: string) => Promise<void>;
  protected _onEnter?: (menu: Self) => Promise<void>;
  protected _setButtons?: (menu: Self) => Promise<MenuButtonConfig<Self>[]>;
  protected _setModal?: (
    menu: Self,
    options?: ModalState['options']
  ) => Promise<ModalConfig<Self>>;
  protected _setSelectMenu?: (menu: Self) => Promise<SelectMenuConfig<Self>>;
  protected _setEmbeds: (menu: Self) => Promise<EmbedBuilder[]>;
  protected _transitions: Map<
    string,
    (menu: Self) => Promise<void>
  > = new Map();

  /**** Constructor ****/

  public constructor(
    session: Session,
    name: string,
    options: MenuBuilderOptions<Self, C>
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
    this._onEnter = options.onEnter;
    this._setButtons = options.setButtons;
    this._setModal = options.setModal;
    this._setSelectMenu = options.setSelectMenu;
    this._setEmbeds = options.setEmbeds;
    if (options.transitions) {
      this._transitions = options.transitions;
    }
  }

  /**** Getters/Setters ****/

  /** Returns this instance typed as the Self type parameter for use in callbacks. */
  protected get self(): Self {
    return this as unknown as Self;
  }

  get client(): FlowCordClient {
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

  get interaction():
    | ChatInputCommandInteraction
    | ComponentInteraction
    | ModalSubmitInteraction {
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

  get modal(): ModalConfig<Self> | undefined {
    return this._modal;
  }

  get name(): string {
    return this._name;
  }

  get paginationConfig(): PaginationConfig<Self> {
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

  get responseType(): MenuResponseType | undefined {
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

  get warningMessage(): string | undefined {
    return this._warningMessage;
  }

  set warningMessage(warningMessage: string | undefined) {
    this._warningMessage = warningMessage;
  }

  /**** Public Methods ****/

  public getResponseOptions() {
    return {
      components: this.components,
      content: this.content,
      embeds: this.embeds,
    };
  }

  /**
   * Execute the onEnter lifecycle hook if defined.
   * Called once when the menu is first entered by the session.
   */
  public async enter(): Promise<void> {
    if (this._onEnter) {
      await this._onEnter(this.self);
    }
  }

  /**
   * Execute a named transition registered via MenuBuilder.addTransition().
   */
  public async executeTransition(name: string): Promise<void> {
    const transition = this._transitions.get(name);
    if (!transition) {
      const available = Array.from(this._transitions.keys());
      const hint =
        available.length > 0
          ? ` Available transitions: ${available.join(', ')}.`
          : ' No transitions have been registered.';
      throw new Error(`No transition registered with name '${name}'.${hint}`);
    }
    await transition(this.self);
  }

  public async refreshButtons() {
    const buttons = await this._setButtons?.(this.self);

    this._buttons.clear();

    buttons?.forEach((button: MenuButtonConfig<Self>, index: number) => {
      if (
        RESERVED_BUTTON_LABELS.includes(
          button.label as (typeof RESERVED_BUTTON_LABELS)[number]
        )
      ) {
        throw new Error(`Button label '${button.label}' is reserved.`);
      }

      if (
        button.id !== undefined &&
        RESERVED_BUTTON_LABELS.includes(
          button.id.toString() as (typeof RESERVED_BUTTON_LABELS)[number]
        )
      ) {
        throw new Error(`Button id '${button.id}' is reserved.`);
      }

      const buttonId = button.id?.toString() ?? button.label;

      this._buttons.set(buttonId, {
        component: new ButtonBuilder()
          .setCustomId(`${this._name}_${buttonId}`)
          .setDisabled(button.disabled ?? false)
          .setLabel(button.label)
          .setStyle(button.style),
        fixedPosition: button.fixedPosition,
        onClick: button.onClick,
        ordinal: index,
      });
    });

    this.validateButtonPaginationOptions();
  }

  public async refreshSelectMenu() {
    if (!this._setSelectMenu) {
      throw new Error('Select Menu cannot be refreshed.');
    }
    this._selectMenu = await this._setSelectMenu(this.self);

    const actionRow = new ActionRowBuilder<AnySelectMenuBuilder>();
    actionRow.addComponents(this._selectMenu.builder);

    this.components = [actionRow];
  }

  public async refreshModal(options?: ModalState['options']) {
    if (!this._setModal) {
      throw new Error('Modal cannot be refreshed.');
    }
    const resolvedOptions =
      options ?? this.session.getState<ModalState>('activeModal')?.options;
    this._modal = await this._setModal(this.self, resolvedOptions);
  }

  public async refresh() {
    if (this._setButtons) {
      await this.refreshButtons();
    }

    if (this._setSelectMenu) {
      await this.refreshSelectMenu();
    }

    if (this._setModal) {
      await this.refreshModal();
    }

    await this.updatePagination();

    this._embeds = await this._setEmbeds(this.self);
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
      await button.onClick(this.self);
    } else {
      throw new Error(`No action defined for button with ID '${buttonId}'.`);
    }
  }

  public async handleSelectMenuInteraction(values: string[]) {
    if (this._selectMenu) {
      await this._selectMenu.onSelect?.(this.self, values);
    } else {
      throw new Error('No select menu handler defined for this menu.');
    }
  }

  public async handleMessageResponse(response: string) {
    if (this._handleMessage) {
      await this._handleMessage(this.self, response);
    } else {
      throw new Error('No message handler defined for this menu.');
    }
  }

  public async handleModalSubmit(fields: ModalSubmitFields) {
    const activeModal = this.session.getState<ModalState>('activeModal');
    if (!this._modal || !activeModal) {
      throw new Error('No modal defined for receiving submission.');
    }

    await this._modal.onSubmit?.(this.self, fields, activeModal.options);
    this.session.deleteState('activeModal');
  }

  /**
   * Trigger the completion handler for this menu
   */
  public async complete(result?: unknown): Promise<void> {
    // Store the completion result in session state for continuation callbacks
    if (result !== undefined) {
      this._session.setMenuCompletionState(this._name, result);
    }
  }

  public async openModal(options?: ModalState['options']): Promise<void> {
    if (!this._setModal) {
      throw new Error('No modal defined for this menu.');
    }

    await this.refreshModal(options);

    const modalId = this.modal?.builder.data.custom_id;

    if (!modalId) {
      throw new Error('Modal must have a custom ID.');
    }

    // Set state once with the final (post-refresh) modal ID
    this.session.setState('activeModal', { id: modalId, options });
  }

  /**
   * Clear modal state without processing a submission.
   * Called when the user dismisses/cancels the modal and interacts with the menu instead.
   */
  public cancelModal(): void {
    this.session.deleteState('activeModal');
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

    const hasBackButton =
      this._reservedButtons.get('Back') && this.session.history.length > 0;
    const hasCancelButton = !!this._reservedButtons.get('Cancel');

    // Single-page slot count: max 10 buttons total across 2 rows
    const singlePageSlotCount =
      10 -
      fixedStartButtons.length -
      fixedEndButtons.length -
      (hasBackButton ? 1 : 0) -
      (hasCancelButton ? 1 : 0);

    // Paginated slot count: row 1 is reserved for content only (max 5 per row)
    const paginatedContentSlotCount =
      5 - fixedStartButtons.length - fixedEndButtons.length;

    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    // Determine whether pagination is needed
    const needsPagination = buttonList.length > singlePageSlotCount;
    const contentPerPage = needsPagination
      ? paginatedContentSlotCount
      : singlePageSlotCount;

    const pageCount = needsPagination
      ? Math.ceil(buttonList.length / contentPerPage)
      : 1;
    const isFirstPage = page === 1;
    const isLastPage = page === pageCount;

    if (page > pageCount) {
      throw new Error(
        'Button page specified is greater than the number of pages.'
      );
    }

    const startIndex = needsPagination
      ? (page - 1) * contentPerPage
      : 0;
    const endIndex = needsPagination
      ? Math.min(page * contentPerPage - 1, buttonList.length - 1)
      : buttonList.length - 1;
    const filteredButtons = buttonList.slice(startIndex, endIndex + 1);

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

    // Build content buttons (row 1 when paginating)
    const contentButtons = [
      ...fixedStartButtons,
      ...filteredButtons,
      ...fixedEndButtons,
    ];

    // Build navigation buttons (always row 2 when paginating)
    const navButtons: ButtonBuilder[] = [];
    if (pageCount > 1 && !isFirstPage) {
      navButtons.push(this.createDefaultButton('Previous'));
    }
    if (pageCount > 1 && !isLastPage) {
      navButtons.push(this.createDefaultButton('Next'));
    }
    if (hasBackButton) {
      navButtons.push(this.createDefaultButton('Back'));
    }
    if (hasCancelButton) {
      navButtons.push(this.createDefaultButton('Cancel'));
    }

    if (needsPagination) {
      // Predictable two-row layout: content in row 1, navigation in row 2.
      // This ensures Back/Cancel and pagination controls are always in the
      // same predictable location regardless of content count.
      if (contentButtons.length > 0) {
        const contentRow = new ActionRowBuilder<ButtonBuilder>();
        contentButtons.forEach((btn) => contentRow.addComponents(btn));
        components.push(contentRow);
      }
      if (navButtons.length > 0) {
        const navRow = new ActionRowBuilder<ButtonBuilder>();
        navButtons.forEach((btn) => navRow.addComponents(btn));
        components.push(navRow);
      }
    } else {
      // Single-page layout: flat button list split at 5 across up to 2 rows
      const allButtons = [...contentButtons, ...navButtons];
      if (allButtons.length <= 5) {
        const actionRow = new ActionRowBuilder<ButtonBuilder>();
        allButtons.forEach((btn) => actionRow.addComponents(btn));
        components.push(actionRow);
      } else {
        const firstActionRow = new ActionRowBuilder<ButtonBuilder>();
        const secondActionRow = new ActionRowBuilder<ButtonBuilder>();
        allButtons.forEach((btn, index) => {
          if (index < 5) {
            firstActionRow.addComponents(btn);
          } else {
            secondActionRow.addComponents(btn);
          }
        });
        components.push(firstActionRow, secondActionRow);
      }
    }

    this.components = components;
  };

  private async paginateList() {
    let showNextButton = false;
    let showPreviousButton = false;

    const { itemsPerPage, getItemTotal } = this._paginationConfig;
    if (!getItemTotal) {
      throw new Error('Must call setListPagination on MenuBuilder instance.');
    }

    const startIndex: number = (this.currentPage - 1) * itemsPerPage;
    const itemTotal = await getItemTotal(this.self);

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
    const fixedStartCount = this._buttons.filter(
      (button) => button.fixedPosition === 'start'
    ).size;
    const fixedEndCount = this._buttons.filter(
      (button) => button.fixedPosition === 'end'
    ).size;

    if (reservedButtonCount + fixedButtonCount > 10) {
      throw new Error(
        `Too many default and fixed buttons defined (>10), not enough slots for paginating custom buttons.`
      );
    }

    // For paginated layout, content buttons share row 1 with fixedStart/End buttons
    const paginatedContentSlots = 5 - fixedStartCount - fixedEndCount;
    if (paginatedContentSlots < 1) {
      throw new Error(
        `Fixed start/end buttons occupy all 5 slots in row 1, leaving no space for paginated content buttons.`
      );
    }
  }
}
