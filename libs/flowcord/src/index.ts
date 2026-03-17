/**
 * FlowCord — Lifecycle-Driven Menu Framework for Discord.js
 *
 * @example
 * import { FlowCord, MenuBuilder, goTo, goBack } from '@flowcord';
 */

// Main entry point
export { FlowCord } from './FlowCord';
export type { FlowCordConfig } from './FlowCord';

// Client abstraction
export type { FlowCordClient } from './FlowCordClient';

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
  ResponseType,
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
  ButtonInputConfig,
  ButtonConfig,
  SelectInputConfig,
  SelectConfig,
  SelectAction,
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
