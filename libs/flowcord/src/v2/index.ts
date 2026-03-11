/**
 * FlowCord v2 — Lifecycle-Driven Menu Framework
 *
 * Public API exports. Coexists with v1 — no migration required.
 *
 * @example
 * import { MenuEngine, MenuBuilder, goTo, goBack } from '@flowcord/v2';
 */

// Engine
export { MenuEngine, MenuSession } from './engine';
export type { MenuEngineConfig } from './engine';

// Menu system
export { MenuBuilder, MenuInstance, MenuRenderer } from './menu';
export type { MenuDefinitionLiteral } from './menu';

// Context
export type {
  MenuContext,
  MenuSessionLike,
  MenuInstanceLike,
  SubMenuOptions,
  ContextExtension,
} from './context';

// Actions
export { goTo, goBack, closeMenu, openModal } from './action';
export { pipeline, guard, GuardFailedError } from './action';
export type { Action, TaggedAction, GuardFn } from './action';

// Lifecycle
export { LifecycleManager } from './lifecycle';
export type { HookFn, HookName, MenuHooks } from './lifecycle';

// State
export { StateStore, StateAccessor, MenuStack } from './state';
export type { MenuStackEntry } from './state';

// Components
export {
  ComponentIdManager,
  validateLayout,
  validateEmbeds,
  reservedButtons,
  buildReservedButtonRow,
  countReservedButtons,
  injectReservedButtons,
} from './components';
export type {
  ParsedComponentId,
  ValidationResult,
  ComponentBreakdown,
  ReservedButtonsOptions,
} from './components';

// Display component helpers (layout mode)
export {
  select,
  text,
  section,
  container,
  separator,
  thumbnail,
  mediaGallery,
  file,
  actionRow,
  button,
  paginatedGroup,
} from './components';
export type {
  SectionOptions,
  ContainerOptions,
  SeparatorOptions,
  ThumbnailOptions,
  FileOptions,
  ButtonOptions,
  SelectOptions,
} from './components';

// Registries
export { MenuRegistry, ActionRegistry, HookRegistry } from './registry';
export type { MenuDefinition, CreateMenuDefinitionFn } from './registry';

// Tracing
export { NavigationTracer } from './tracing';
export type { NavigationEvent } from './tracing';

// Types
export type {
  Awaitable,
  RenderMode,
  RenderOutput,
  EmbedsRenderOutput,
  LayoutRenderOutput,
  ComponentConfig,
  TextDisplayConfig,
  SectionConfig,
  ContainerConfig,
  SeparatorConfig,
  ThumbnailConfig,
  MediaGalleryConfig,
  MediaGalleryItemConfig,
  FileConfig,
  ActionRowConfig,
  ButtonConfig,
  SelectConfig,
  ModalConfig,
  PaginatedGroupConfig,
  ReservedButtonsPlaceholderConfig,
  MenuContextLike,
  PaginationOptions,
  ListPaginationOptions,
  ButtonPaginationOptions,
  SetButtonsOptions,
  PaginationState,
} from './types';

export type { MenuEnvironment } from './types';
export type { ComponentInteraction, AnySessionInteraction } from './types';
