// Components module — ID management, validation, helpers, display components
export { ComponentIdManager } from './ComponentIdManager';
export type { ParsedComponentId } from './ComponentIdManager';

export { validateLayout, validateEmbeds } from './ComponentValidator';
export type {
  ValidationResult,
  ComponentBreakdown,
} from './ComponentValidator';

export {
  reservedButtons,
  buildReservedButtonRow,
  countReservedButtons,
  injectReservedButtons,
} from './reservedButtons';
export type { ReservedButtonsOptions } from './reservedButtons';

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
} from './display';
export type {
  SelectOptions,
  SectionOptions,
  ContainerOptions,
  SeparatorOptions,
  ThumbnailOptions,
  FileOptions,
  ButtonOptions,
} from './display';
export type { ModalConfig } from '../types';
