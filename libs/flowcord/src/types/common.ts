/**
 * Common utility types used throughout FlowCord.
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
export type ComponentConfig<TCtx = MenuContextLike> =
  | TextDisplayConfig
  | SectionConfig<TCtx>
  | ContainerConfig<TCtx>
  | SeparatorConfig
  | ThumbnailConfig
  | MediaGalleryConfig
  | FileConfig
  | ActionRowConfig<TCtx>
  | ButtonConfig<TCtx>
  | SelectConfig<TCtx>
  | PaginatedGroupConfig<TCtx>
  | ReservedButtonsPlaceholderConfig;

// --- Display Components (Layout mode) ---

export interface TextDisplayConfig {
  type: 'text_display';
  content: string;
}

export interface SectionConfig<TCtx = MenuContextLike> {
  type: 'section';
  text: (string | TextDisplayConfig)[];
  accessory?: ButtonConfig<TCtx> | ThumbnailConfig;
}

export interface ContainerConfig<TCtx = MenuContextLike> {
  type: 'container';
  accentColor?: number;
  spoiler?: boolean;
  children: ComponentConfig<TCtx>[];
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

export interface ActionRowConfig<TCtx = MenuContextLike> {
  type: 'action_row';
  children: (ButtonConfig<TCtx> | SelectConfig<TCtx>)[];
}

export interface ButtonConfig<TCtx = MenuContextLike> {
  type: 'button';
  label: string;
  style: ButtonStyle;
  id?: string;
  disabled?: boolean;
  emoji?: string;
  action?: Action<TCtx>;
  /**
   * Marks this button as a modal trigger. When clicked, the framework will
   * show the menu's modal instead of deferring the interaction.
   * Mutually exclusive with `action` — if both are set, `opensModal` takes
   * precedence and `action` is ignored.
   *
   * - `true` opens the default (unnamed) modal
   * - A string opens the modal with that specific ID
   */
  opensModal?: boolean | string;
  /**
   * URL for link buttons. When set, `style` must be `ButtonStyle.Link`.
   * Link buttons are handled natively by Discord — no interaction is generated,
   * and `action`/`opensModal` are ignored.
   */
  url?: string;
  /** Used by embed-mode pagination: pin button to start/end across pages */
  fixedPosition?: 'start' | 'end';
}

/**
 * Consumer-facing button shape for builder APIs.
 * `type` is optional because the builder already knows it is normalizing buttons.
 */
export type ButtonInputConfig<TCtx = MenuContextLike> = Omit<
  ButtonConfig<TCtx>,
  'type'
> & {
  type?: 'button';
};

export interface SelectConfig<TCtx = MenuContextLike> {
  type: 'select';
  builder: AnySelectMenuBuilder;
  id?: string;
  onSelect?: SelectAction<TCtx>;
}

/**
 * Consumer-facing select shape for builder APIs.
 * `type` is optional because the builder already knows it is normalizing a select menu.
 */
export type SelectInputConfig<TCtx = MenuContextLike> = Omit<
  SelectConfig<TCtx>,
  'type'
> & {
  type?: 'select';
};

// --- Pagination marker ---

export interface PaginatedGroupConfig<TCtx = MenuContextLike> {
  type: 'paginated_group';
  buttons: ButtonConfig<TCtx>[];
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
 *
 * Generic over TCtx so that builder subclasses (e.g. AdminMenuBuilder)
 * can provide a richer context type to inline callbacks.
 */
export type Action<TCtx = MenuContextLike> = (ctx: TCtx) => Awaitable<void>;

/**
 * A select menu action receives the context and the selected values.
 * Mirrors the handleMessage(ctx, response) pattern.
 */
export type SelectAction<TCtx = MenuContextLike> = (
  ctx: TCtx,
  values: string[]
) => Awaitable<void>;

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
 * Modal configuration for menus.
 * The modal builder is a standard Discord.js ModalBuilder,
 * but the onSubmit handler uses the FlowCord action pattern.
 */
export interface ModalConfig<TCtx = MenuContextLike> {
  /** Optional identifier for multi-modal menus. Omit for single-modal menus. */
  id?: string;
  builder: ModalBuilder;
  onSubmit?: (ctx: TCtx, fields: ModalSubmitFields) => Promise<void>;
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
