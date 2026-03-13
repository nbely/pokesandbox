/**
 * Common utility types used throughout FlowCord v2.
 */
import type {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Interaction,
  MessageActionRowComponentBuilder,
  ModalBuilder,
  ModalSubmitFields,
} from 'discord.js';

type AnySelectMenuBuilder = Exclude<
  MessageActionRowComponentBuilder,
  ButtonBuilder
>;

/**
 * A value that can be either synchronous or a Promise.
 */
export type Awaitable<T> = T | Promise<T>;

/**
 * The rendering mode a menu operates in.
 * - 'embeds': Traditional Discord embeds + action rows (default)
 * - 'layout': Discord Components v2 (display components with IsComponentsV2 flag)
 */
export type RenderMode = 'embeds' | 'layout';

/**
 * Output from a menu render cycle, dispatched to the MenuRenderer.
 */
export type RenderOutput = EmbedsRenderOutput | LayoutRenderOutput;

export interface EmbedsRenderOutput {
  mode: 'embeds';
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<MessageActionRowComponentBuilder>[];
  content?: string;
}

export interface LayoutRenderOutput {
  mode: 'layout';
  components: ComponentConfig[];
}

// ---------------------------------------------------------------------------
// Component Configs — framework-internal representations of display components.
// These are NOT Discord.js builders — they are plain objects the MenuRenderer
// converts to Discord API payloads at send time.
// ---------------------------------------------------------------------------

/** Discriminated union of all component configs */
export type ComponentConfig =
  | TextDisplayConfig
  | SectionConfig
  | ContainerConfig
  | SeparatorConfig
  | ThumbnailConfig
  | MediaGalleryConfig
  | FileConfig
  | ActionRowConfig
  | ButtonConfig
  | SelectConfig
  | PaginatedGroupConfig
  | ReservedButtonsPlaceholderConfig;

// --- Display Components (Layout mode) ---

export interface TextDisplayConfig {
  type: 'text_display';
  content: string;
}

export interface SectionConfig {
  type: 'section';
  text: (string | TextDisplayConfig)[];
  accessory?: ButtonConfig | ThumbnailConfig;
}

export interface ContainerConfig {
  type: 'container';
  accentColor?: number;
  spoiler?: boolean;
  children: ComponentConfig[];
}

export interface SeparatorConfig {
  type: 'separator';
  divider?: boolean;
  spacing?: 'small' | 'large';
}

export interface ThumbnailConfig {
  type: 'thumbnail';
  url: string;
  description?: string;
  spoiler?: boolean;
}

export interface MediaGalleryConfig {
  type: 'media_gallery';
  items: MediaGalleryItemConfig[];
}

export interface MediaGalleryItemConfig {
  url: string;
  description?: string;
  spoiler?: boolean;
}

export interface FileConfig {
  type: 'file';
  url: string;
  spoiler?: boolean;
}

// --- Interactive Components (shared across modes) ---

export interface ActionRowConfig {
  type: 'action_row';
  children: (ButtonConfig | SelectConfig)[];
}

export interface ButtonConfig {
  type: 'button';
  label: string;
  style: ButtonStyle;
  id?: string;
  disabled?: boolean;
  emoji?: string;
  action?: Action;
  /** Used by embed-mode pagination: pin button to start/end across pages */
  fixedPosition?: 'start' | 'end';
}

export interface SelectConfig {
  type: 'select';
  builder: AnySelectMenuBuilder;
  id?: string;
  onSelect?: Action;
}

// --- Pagination marker ---

export interface PaginatedGroupConfig {
  type: 'paginated_group';
  buttons: ButtonConfig[];
  options?: ButtonPaginationOptions;
}

// --- Reserved buttons placeholder (layout mode) ---

export interface ReservedButtonsPlaceholderConfig {
  type: 'reserved_buttons_placeholder';
}

// ---------------------------------------------------------------------------
// Action type — the unified callback contract for all interactive components
// ---------------------------------------------------------------------------

/**
 * An action is either an inline async callback or a built-in factory result.
 * All interactive components (buttons, selects, modals) use this same type.
 */
export type Action = (ctx: MenuContextLike) => Awaitable<void>;

/**
 * Minimal context shape that Action callbacks accept.
 * The full MenuContext extends this — using a minimal interface here
 * avoids circular dependencies in the types layer.
 */
export interface MenuContextLike {
  session: unknown;
  menu: unknown;
  state: unknown;
  sessionState: unknown;
  client: Client<true>;
  interaction: Interaction;
  goTo(menuId: string, options?: Record<string, unknown>): Promise<void>;
  goBack(result?: unknown): Promise<void>;
  close(): Promise<void>;
  hardRefresh(): Promise<void>;
  openSubMenu(
    menuId: string,
    opts: { onComplete: Action; [key: string]: unknown }
  ): Promise<void>;
  complete(result?: unknown): Promise<void>;
}

/**
 * Modal configuration for v2 menus.
 * The modal builder is a standard Discord.js ModalBuilder,
 * but the onSubmit handler uses the v2 action pattern.
 */
export interface ModalConfig {
  builder: ModalBuilder;
  onSubmit?: (ctx: MenuContextLike, fields: ModalSubmitFields) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Pagination option types
// ---------------------------------------------------------------------------

export interface PaginationOptions {
  /** Always show both nav buttons (disabled when N/A). Default: true */
  stableButtons?: boolean;
  labels?: {
    next?: string;
    previous?: string;
  };
}

export interface ListPaginationOptions extends PaginationOptions {
  getTotalQuantityItems: (ctx: MenuContextLike) => Awaitable<number>;
  itemsPerPage?: number;
}

export interface ButtonPaginationOptions extends PaginationOptions {
  perPage?: number;
}

export interface SetButtonsOptions {
  pagination?: ButtonPaginationOptions;
}

// ---------------------------------------------------------------------------
// Pagination runtime state
// ---------------------------------------------------------------------------

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}
