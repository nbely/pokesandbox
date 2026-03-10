import type {
  ButtonBuilder,
  ButtonStyle,
  Collection,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
  ModalBuilder,
  ModalSubmitFields,
} from 'discord.js';
import type { Menu } from '../menu/Menu';
import type { MenuPaginationType, MenuResponseType } from './constants';
import type { MenuCommandOptions } from './interaction.types';

/**
 * Configuration options for MenuBuilder
 */
export type MenuBuilderOptions<
  M extends Menu = Menu,
  O extends MenuCommandOptions = MenuCommandOptions
> = {
  commandOptions: O;
  isTrackedInHistory: boolean;
  paginationConfig: PaginationConfig<M>;
  reservedButtons: Collection<ReservedButtonLabels, ReservedButtonOptions>;
  responseType?: MenuResponseType;
  handleMessage?: (menu: M, response: string) => Promise<void>;
  onEnter?: (menu: M) => Promise<void>;
  setButtons?: (menu: M) => Promise<MenuButtonConfig<M>[]>;
  setEmbeds: (menu: M) => Promise<EmbedBuilder[]>;
  setSelectMenu?: (menu: M) => Promise<SelectMenuConfig<M>>;
  setModal?: (
    menu: M,
    options?: ModalState['options']
  ) => Promise<ModalConfig<M>>;
  transitions?: Map<string, (menu: M) => Promise<void>>;
};

/**
 * Configuration for a menu button
 */
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

/**
 * Internal representation of a menu button
 */
export type MenuButton<M extends Menu = Menu> = Pick<
  MenuButtonConfig<M>,
  'fixedPosition' | 'onClick'
> & {
  component: ButtonBuilder;
  ordinal: number;
};

/**
 * Configuration for a modal dialog
 */
export type ModalConfig<M extends Menu = Menu> = {
  /** The builder for the modal */
  builder: ModalBuilder;
  /** The onSubmit handler for the modal */
  onSubmit?: (
    menu: M,
    fields: ModalSubmitFields,
    options?: ModalState['options']
  ) => Promise<void>;
};

/**
 * State tracking for an active modal
 */
export type ModalState = {
  id: string;
  options?: Record<string, unknown>;
};

/**
 * Any select menu builder (excludes buttons)
 */
export type AnySelectMenuBuilder = Exclude<
  MessageActionRowComponentBuilder,
  ButtonBuilder
>;

/**
 * Configuration for a select menu
 */
export type SelectMenuConfig<M extends Menu = Menu> = {
  /** The builder for the select menu */
  builder: AnySelectMenuBuilder;
  /** The onSelect handler for the select menu */
  onSelect?: (menu: M, values: string[]) => Promise<void>;
};

/**
 * Reserved button labels for navigation
 */
export type ReservedButtonLabels = 'Back' | 'Cancel' | 'Next' | 'Previous';

/**
 * Options for reserved navigation buttons
 */
export type ReservedButtonOptions = {
  label: string;
  style: ButtonStyle;
};

/**
 * Configuration for menu pagination
 */
export type PaginationConfig<M extends Menu = Menu> = {
  itemsPerPage: number;
  type?: MenuPaginationType;
  getItemTotal?: (menu: M) => Promise<number>;
};

/**
 * Options for button pagination
 */
export interface PaginationOptions {
  nextButton?: Partial<ReservedButtonOptions>;
  previousButton?: Partial<ReservedButtonOptions>;
  quantityItemsPerPage?: number;
}

/**
 * Options for list pagination (requires total item count)
 */
export interface ListPaginationOptions<M extends Menu = Menu>
  extends PaginationOptions {
  getTotalQuantityItems: (menu: M) => Promise<number>;
}

/**
 * Current state of pagination
 */
export type PaginationState = {
  endIndex: number;
  page: number;
  quantity: number;
  range: string;
  startIndex: number;
  total: number;
};
