/**
 * Reserved button labels used by the framework for navigation
 */
export const RESERVED_BUTTON_LABELS = [
  'Back',
  'Cancel',
  'Next',
  'Previous',
] as const;

/**
 * Type of response expected from a menu
 */
export enum MenuResponseType {
  COMPONENT = 'COMPONENT', // Buttons, select menus
  MESSAGE = 'MESSAGE', // Text message response
  MIXED = 'MIXED', // Both component and message responses accepted
}

/**
 * Type of pagination used by a menu
 */
export enum MenuPaginationType {
  BUTTONS = 'buttons', // Paginate through button pages
  LIST = 'list', // Paginate through list items
}
