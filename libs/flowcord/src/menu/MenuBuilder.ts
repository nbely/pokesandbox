import { ButtonStyle, Collection, type EmbedBuilder } from 'discord.js';

import { Menu } from './Menu';
import { Session } from '../session/Session';
import {
  ListPaginationOptions,
  MenuBuilderOptions,
  MenuButton,
  MenuButtonConfig,
  MenuCommandOptions,
  MenuPaginationType,
  MenuResponseType,
  ModalConfig,
  ModalState,
  PaginationOptions,
  ReservedButtonLabels,
  ReservedButtonOptions,
  SelectMenuConfig,
} from '../types';

export class MenuBuilder<
  M extends Menu = Menu,
  O extends MenuCommandOptions = MenuCommandOptions
> {
  private _buttons: Collection<string, MenuButton> = new Collection();
  private _isTrackedInHistory = false;
  private _paginationItemsPerPage = 10;
  private _paginationType?: MenuPaginationType;
  private _reservedButtons: Collection<
    ReservedButtonLabels,
    ReservedButtonOptions
  > = new Collection();
  private _getListPaginationTotalQuantityItems?: (menu: M) => Promise<number>;
  private _handleMessageCallback?: (menu: M, response: string) => Promise<void>;
  private _onEnterCallback?: (menu: M) => Promise<void>;
  private _setButtonsCallback?: (menu: M) => Promise<MenuButtonConfig<M>[]>;
  private _setEmbedsCallback?: (menu: M) => Promise<EmbedBuilder[]>;
  private _setModalCallback?: (
    menu: M,
    options?: ModalState['options']
  ) => Promise<ModalConfig<M>>;
  private _setSelectMenuCallback?: (menu: M) => Promise<SelectMenuConfig<M>>;
  private _transitions: Map<string, (menu: M) => Promise<void>> = new Map();

  protected _name: string;
  protected _session: Session;
  protected _commandOptions: O;

  /**** Constructor ****/

  public constructor(session: Session, name: string, commandOptions?: O) {
    this._name = name;
    this._session = session;
    this._commandOptions = commandOptions ?? ({} as O);
  }

  /**** Public Methods ****/

  public async build(): Promise<M> {
    if (
      !this._paginationType &&
      (this._reservedButtons.size > 0 || this._setButtonsCallback)
    ) {
      this._paginationType = MenuPaginationType.BUTTONS;
    }
    this.validateBuilder();
    return this.createMenu();
  }

  public setButtons(
    callback: (menu: M) => Promise<MenuButtonConfig<M>[]>,
    paginationOptions?: PaginationOptions
  ) {
    this._setButtonsCallback = callback;
    this.setPaginationOptions(paginationOptions);
    return this;
  }

  public setModal(
    callback: (
      menu: M,
      options?: ModalState['options']
    ) => Promise<ModalConfig<M>>
  ) {
    this._setModalCallback = callback;
    return this;
  }

  public setSelectMenu(callback: (menu: M) => Promise<SelectMenuConfig<M>>) {
    this._setSelectMenuCallback = callback;
    return this;
  }

  public setCancellable(cancelButtonOptions?: Partial<ReservedButtonOptions>) {
    this._reservedButtons.set('Cancel', {
      label: cancelButtonOptions?.label ?? 'Cancel',
      style: cancelButtonOptions?.style ?? ButtonStyle.Secondary,
    });

    return this;
  }

  public setEmbeds(callback: (menu: M) => Promise<EmbedBuilder[]>) {
    this._setEmbedsCallback = callback;
    return this;
  }

  public setListPagination(options: ListPaginationOptions<M>) {
    this._paginationType = MenuPaginationType.LIST;
    this.setPaginationOptions(options);
    this._getListPaginationTotalQuantityItems = options.getTotalQuantityItems;

    return this;
  }

  public setMessageHandler(
    callback: (menu: M, response: string) => Promise<void>
  ) {
    this._handleMessageCallback = callback;
    return this;
  }

  /**
   * Register a lifecycle hook that is called once when the menu is first entered.
   * This is useful for performing one-time initialization such as pre-loading data
   * into session state before the menu is displayed to the user.
   *
   * @example
   * ```typescript
   * builder.onEnter(async (menu) => {
   *   const data = await fetchExpensiveData();
   *   menu.session.setState('data', data);
   * });
   * ```
   */
  public onEnter(callback: (menu: M) => Promise<void>) {
    this._onEnterCallback = callback;
    return this;
  }

  /**
   * Register a named transition that can be triggered from button onClick handlers
   * via `menu.executeTransition(name)`. This decouples navigation logic from button
   * definitions and makes transitions reusable across multiple buttons.
   *
   * Throws if a transition with the same name has already been registered.
   *
   * @param name - Unique name for the transition
   * @param callback - Async function executed when the transition is triggered
   *
   * @example
   * ```typescript
   * builder.addTransition('edit', async (menu) => {
   *   await MenuWorkflow.openMenu(menu, EDIT_COMMAND, { region_id });
   * });
   * // Then in a button:
   * { label: 'Edit', style: ButtonStyle.Primary,
   *   onClick: (menu) => menu.executeTransition('edit') }
   * ```
   */
  public addTransition(name: string, callback: (menu: M) => Promise<void>) {
    if (this._transitions.has(name)) {
      throw new Error(
        `A transition with name '${name}' has already been registered.`
      );
    }
    this._transitions.set(name, callback);
    return this;
  }

  public setReturnable(backButtonOptions?: Partial<ReservedButtonOptions>) {
    this._reservedButtons.set('Back', {
      label: backButtonOptions?.label ?? 'Back',
      style: backButtonOptions?.style ?? ButtonStyle.Secondary,
    });

    return this;
  }

  public setTrackedInHistory() {
    this._isTrackedInHistory = true;
    return this;
  }

  /**** Private Methods ****/

  private setPaginationOptions(options?: PaginationOptions) {
    this._reservedButtons.set('Next', {
      label: options?.nextButton?.label ?? 'Next',
      style: options?.nextButton?.style ?? ButtonStyle.Secondary,
    });

    this._reservedButtons.set('Previous', {
      label: options?.previousButton?.label ?? 'Previous',
      style: options?.previousButton?.style ?? ButtonStyle.Secondary,
    });

    this._paginationItemsPerPage =
      options?.quantityItemsPerPage ?? this._paginationItemsPerPage;
  }

  private validateListPaginationOptions() {
    const reservedButtonCount = this._reservedButtons.size;
    const totalButtonCount = reservedButtonCount + this._buttons.size;

    if (totalButtonCount > 10) {
      throw new Error(
        `Cannot set more than ${
          10 - reservedButtonCount
        } custom buttons on this list paginated menu.`
      );
    }
  }

  /**** Protected Methods ****/

  protected async createMenu(): Promise<M> {
    return new Menu(
      this._session,
      this._name,
      this.getBuilderOptions() as MenuBuilderOptions<Menu, O>
    ) as M;
  }

  /**
   * Returns the options for the menu builder.
   * @returns {MenuBuilderOptions} The options for the menu builder.
   */
  protected getBuilderOptions(): MenuBuilderOptions<M, O> {
    let responseType: MenuResponseType | undefined;

    if (
      this._handleMessageCallback &&
      (this._setButtonsCallback || !!this._reservedButtons.size)
    ) {
      responseType = MenuResponseType.MIXED;
    } else if (this._handleMessageCallback) {
      responseType = MenuResponseType.MESSAGE;
    } else if (
      this._setButtonsCallback ||
      this._setSelectMenuCallback ||
      !!this._reservedButtons.size
    ) {
      responseType = MenuResponseType.COMPONENT;
    }

    if (!this._setEmbedsCallback) {
      throw new Error('Embeds are required to build a menu.');
    }

    return {
      commandOptions: this._commandOptions,
      isTrackedInHistory: this._isTrackedInHistory,
      paginationConfig: {
        itemsPerPage: this._paginationItemsPerPage,
        getItemTotal: this._getListPaginationTotalQuantityItems,
        type: this._paginationType,
      },
      reservedButtons: this._reservedButtons,
      responseType,
      handleMessage: this._handleMessageCallback,
      onEnter: this._onEnterCallback,
      setButtons: this._setButtonsCallback,
      setEmbeds: this._setEmbedsCallback,
      setModal: this._setModalCallback,
      setSelectMenu: this._setSelectMenuCallback,
      transitions: this._transitions,
    };
  }

  protected validateBuilder() {
    if (this._paginationType && this._setSelectMenuCallback) {
      throw new Error(
        'Cannot set a select menu on a menu with buttons or pagination.'
      );
    } else if (this._paginationType === MenuPaginationType.LIST) {
      this.validateListPaginationOptions();
    }
  }
}
