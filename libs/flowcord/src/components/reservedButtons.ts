/**
 * Reserved button injection and placement logic.
 *
 * Reserved buttons (Back, Cancel, Next, Previous, page counter) are
 * framework-managed. The framework auto-injects them as an action row
 * at the appropriate position.
 *
 * ## Embed mode
 * Appended as the last action row.
 *
 * ## Layout mode
 * Appended at the bottom by default. Developers can override placement
 * with a `reservedButtons()` placeholder in their layout.
 *
 * ## Pagination UX
 * - Embed mode: max 4 buttons (page counter in embed footer)
 * - Layout mode: max 5 buttons (disabled counter button between Previous/Next)
 * - Stable positioning: always show both nav buttons (disabled when N/A)
 */
import { ButtonStyle } from 'discord.js';
import type {
  ActionRowConfig,
  ButtonConfig,
  ComponentConfig,
  PaginationState,
  ReservedButtonsPlaceholderConfig,
  RenderMode,
} from '../types';

// ---------------------------------------------------------------------------
// Public: placeholder for layout mode
// ---------------------------------------------------------------------------

/**
 * Returns a placeholder config that tells the renderer
 * "put the reserved buttons here instead of auto-appending".
 */
export function reservedButtons(): ReservedButtonsPlaceholderConfig {
  return { type: 'reserved_buttons_placeholder' };
}

// ---------------------------------------------------------------------------
// Reserved button configuration
// ---------------------------------------------------------------------------

export interface ReservedButtonsOptions {
  /** Show the Back button */
  showBack: boolean;
  /** Show the Cancel button */
  showCancel: boolean;
  /** Pagination state (null if no pagination) */
  pagination: PaginationState | null;
  /** Whether nav buttons are always visible (disabled when N/A). Default true. */
  stableButtons: boolean;
  /** Rendering mode — affects page counter placement */
  mode: RenderMode;
  /** Custom labels */
  labels?: {
    back?: string;
    cancel?: string;
    next?: string;
    previous?: string;
  };
}

/**
 * Build the reserved button action row based on current session/pagination state.
 */
export function buildReservedButtonRow(
  options: ReservedButtonsOptions
): ActionRowConfig | null {
  const { showBack, showCancel, pagination, stableButtons, mode, labels } =
    options;

  const buttons: ButtonConfig[] = [];

  // --- Back button ---
  if (showBack) {
    buttons.push({
      type: 'button',
      label: labels?.back ?? 'Back',
      style: ButtonStyle.Secondary,
      id: '__reserved_back',
    });
  }

  // --- Pagination buttons ---
  if (pagination) {
    const isFirstPage = pagination.currentPage <= 0;
    const isLastPage = pagination.currentPage >= pagination.totalPages - 1;
    const showPrevious = stableButtons || !isFirstPage;
    const showNext = stableButtons || !isLastPage;

    if (showPrevious) {
      buttons.push({
        type: 'button',
        label: labels?.previous ?? '◀',
        style: ButtonStyle.Secondary,
        id: '__reserved_previous',
        disabled: isFirstPage,
      });
    }

    // Layout mode: disabled counter button between Previous and Next
    if (mode === 'layout') {
      buttons.push({
        type: 'button',
        label: `${pagination.currentPage + 1} of ${pagination.totalPages}`,
        style: ButtonStyle.Secondary,
        id: '__reserved_page_counter',
        disabled: true,
      });
    }

    if (showNext) {
      buttons.push({
        type: 'button',
        label: labels?.next ?? '▶',
        style: ButtonStyle.Secondary,
        id: '__reserved_next',
        disabled: isLastPage,
      });
    }
  }

  // --- Cancel button ---
  if (showCancel) {
    buttons.push({
      type: 'button',
      label: labels?.cancel ?? 'Cancel',
      style: ButtonStyle.Danger,
      id: '__reserved_cancel',
    });
  }

  if (buttons.length === 0) return null;

  return {
    type: 'action_row',
    children: buttons,
  };
}

/**
 * Count how many reserved buttons will be in the row.
 * Used by ComponentValidator for budget calculation.
 */
export function countReservedButtons(options: ReservedButtonsOptions): number {
  let count = 0;
  if (options.showBack) count++;
  if (options.showCancel) count++;
  if (options.pagination) {
    const isFirstPage = options.pagination.currentPage <= 0;
    const isLastPage =
      options.pagination.currentPage >= options.pagination.totalPages - 1;
    if (options.stableButtons || !isFirstPage) count++; // Previous
    if (options.stableButtons || !isLastPage) count++; // Next
    if (options.mode === 'layout') count++; // Page counter
  }
  return count;
}

/**
 * Inject the reserved button row into a layout component tree.
 * Replaces a `reserved_buttons_placeholder` if present, otherwise appends.
 */
export function injectReservedButtons(
  components: ComponentConfig[],
  row: ActionRowConfig
): ComponentConfig[] {
  const result: ComponentConfig[] = [];
  let injected = false;

  for (const component of components) {
    if (component.type === 'reserved_buttons_placeholder') {
      result.push(row);
      injected = true;
    } else if (component.type === 'container' && !injected) {
      // Search inside containers for the placeholder
      const injectedChildren = injectReservedButtons(component.children, row);
      const hadPlaceholder = containsPlaceholder(component.children);
      result.push({
        ...component,
        children: injectedChildren,
      });
      if (hadPlaceholder) injected = true;
    } else {
      result.push(component);
    }
  }

  // If no placeholder found, append at the end
  if (!injected) {
    result.push(row);
  }

  return result;
}

function containsPlaceholder(components: ComponentConfig[]): boolean {
  for (const c of components) {
    if (c.type === 'reserved_buttons_placeholder') return true;
    if (c.type === 'container' && containsPlaceholder(c.children)) return true;
  }
  return false;
}
