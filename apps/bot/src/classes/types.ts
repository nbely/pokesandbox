import {
  ButtonBuilder,
  ButtonStyle,
  Collection,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
} from 'discord.js';

import { MenuPaginationType, MenuResponseType } from './constants';
import { Menu } from './Menu/Menu';

/** Menu Types */

export type MenuBuilderOptions<M extends Menu = Menu> = {
  commandOptions?: string[];
  isTrackedInHistory: boolean;
  paginationConfig: PaginationConfig<M>;
  reservedButtons: Collection<ReservedButtonLabels, ReservedButtonOptions>;
  responseType?: MenuResponseType;
  handleMessage?: (menu: M, response: string) => Promise<void>;
  setButtons?: (menu: M) => Promise<MenuButtonConfig[]>;
  setEmbeds: (menu: M) => Promise<EmbedBuilder[]>;
  setSelectMenu?: (menu: M) => SelectMenuConfig<M>;
};

/** Menu Button Types */

export type MenuButtonConfig<M extends Menu = Menu> = {
  /** Whether the button should be disabled */
  disabled?: boolean;
  /** Whether the button should be fixed to the start or end of the menu */
  fixedPosition?: 'start' | 'end';
  /** The ID of the button, defaults to the label if undefined */
  id?: number | string;
  /** The label of the button */
  label: string;
  /** The style of the button */
  style: ButtonStyle;
  /** Custom handler to run if defined */
  onClick?: (menu: M) => Promise<void>;
};

export type MenuButton = Pick<MenuButtonConfig, 'fixedPosition' | 'onClick'> & {
  component: ButtonBuilder;
  ordinal: number;
};

export type AnySelectMenuBuilder = Exclude<
  MessageActionRowComponentBuilder,
  ButtonBuilder
>;

export type SelectMenuConfig<M extends Menu = Menu> = {
  /** The builder for the select menu */
  builder: AnySelectMenuBuilder;
  /** The onClick handler for the select menu */
  onSelect?: (menu: M, values: string[]) => Promise<void>;
};

export type SessionHistoryEntry = {
  menu: Menu;
  options?: string[];
};

export type ReservedButtonLabels = 'Back' | 'Cancel' | 'Next' | 'Previous';

export type ReservedButtonOptions = {
  label: string;
  style: ButtonStyle;
};

/** Menu Pagination Types */

export type PaginationConfig<M extends Menu = Menu> = {
  itemsPerPage: number;
  type: MenuPaginationType;
  getItemTotal?: (menu: M) => Promise<number>;
};

export interface PaginationOptions {
  nextButton?: Partial<ReservedButtonOptions>;
  previousButton?: Partial<ReservedButtonOptions>;
  quantityItemsPerPage?: number;
}

export interface ListPaginationOptions<M extends Menu = Menu>
  extends PaginationOptions {
  getTotalQuantityItems: (menu: M) => Promise<number>;
}

export type PaginationState = {
  endIndex: number;
  page: number;
  quantity: number;
  range: string;
  startIndex: number;
  total: number;
};
