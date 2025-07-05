import { ButtonStyle, Collection, type EmbedBuilder } from 'discord.js';

import { MenuPaginationType, MenuResponseType } from '../constants';
import { Menu } from './Menu';
import { Session } from '../Session/Session';
import {
  ListPaginationOptions,
  MenuBuilderOptions,
  MenuButton,
  MenuButtonConfig,
  PaginationOptions,
  ReservedButtonLabels,
  ReservedButtonOptions,
  SelectMenuConfig,
} from '../types';

export class MenuBuilder<M extends Menu = Menu> {
  private _buttons: Collection<string, MenuButton> = new Collection();
  private _commandOptions: string[] = [];
  private _isTrackedInHistory = false;
  private _paginationItemsPerPage = 10;
  private _paginationType?: MenuPaginationType;
  private _reservedButtons: Collection<
    ReservedButtonLabels,
    ReservedButtonOptions
  > = new Collection();
  private _getListPaginationTotalQuantityItems: (menu: M) => Promise<number>;
  private _handleMessageCallback?: (menu: M, response: string) => Promise<void>;
  private _setButtonsCallback?: (menu: M) => Promise<MenuButtonConfig[]>;
  private _setEmbedsCallback?: (menu: M) => Promise<EmbedBuilder[]>;
  private _setSelectMenuCallback?: (menu: M) => SelectMenuConfig;
  private _onCompleteCallback?: (menu: M, result: unknown) => Promise<void>;

  protected _name: string;
  protected _session: Session;

  /**** Constructor ****/

  public constructor(session: Session, name: string) {
    this._name = name;
    this._session = session;
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
    callback: (menu: M) => Promise<MenuButtonConfig[]>,
    paginationOptions?: PaginationOptions
  ) {
    this._setButtonsCallback = callback;
    this.setPaginationOptions(paginationOptions);
    return this;
  }

  public setSelectMenu(callback: (menu: M) => SelectMenuConfig) {
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

  public setCommandOptions(options: string | string[]) {
    this._commandOptions = typeof options === 'string' ? [options] : options;
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

  public setCompletionHandler(
    callback: (menu: M, result: unknown) => Promise<void>
  ) {
    this._onCompleteCallback = callback;
    return this;
  }

  public setReturnable(returnButtonOptions?: Partial<ReservedButtonOptions>) {
    this._reservedButtons.set('Back', {
      label: returnButtonOptions?.label ?? 'Back',
      style: returnButtonOptions?.style ?? ButtonStyle.Secondary,
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
        } custom buttons on a menu when list pagination is set.`
      );
    }
  }

  /**** Protected Methods ****/

  protected async createMenu(): Promise<M> {
    return new Menu(this._session, this._name, this.getBuilderOptions()) as M;
  }

  /**
   * Returns the options for the menu builder.
   * @returns {MenuBuilderOptions} The options for the menu builder.
   */
  protected getBuilderOptions(): MenuBuilderOptions {
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
      setButtons: this._setButtonsCallback,
      setEmbeds: this._setEmbedsCallback,
      setSelectMenu: this._setSelectMenuCallback,
      onComplete: this._onCompleteCallback,
    };
  }

  protected validateBuilder() {
    if (this._paginationType && this._setSelectMenuCallback) {
      throw new Error(
        'Cannot set a select menu on a menu with buttons or pagination.'
      );
    } else if (this._paginationType === MenuPaginationType.BUTTONS) {
      // this.validateButtonPaginationOptions();
    } else if (this._paginationType === MenuPaginationType.LIST) {
      this.validateListPaginationOptions();
    }
  }
}
