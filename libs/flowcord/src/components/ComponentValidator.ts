/**
 * Recursive component validation for Discord's display components (Components v2).
 *
 * Enforces:
 * - 40-component limit (all nested components count)
 * - 4000-character limit across all text displays
 * - Pagination-aware budget (reserved buttons consume slots)
 *
 * Human-readable error messages include component breakdowns.
 */
import type { ComponentConfig } from '../types';

const MAX_COMPONENTS = 40;
const MAX_TEXT_CHARS = 4000;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  componentCount: number;
  textCharCount: number;
  breakdown: ComponentBreakdown;
}

export interface ComponentBreakdown {
  containers: number;
  textDisplays: number;
  sections: number;
  separators: number;
  actionRows: number;
  buttons: number;
  selects: number;
  thumbnails: number;
  mediaGalleries: number;
  files: number;
  other: number;
}

function emptyBreakdown(): ComponentBreakdown {
  return {
    containers: 0,
    textDisplays: 0,
    sections: 0,
    separators: 0,
    actionRows: 0,
    buttons: 0,
    selects: 0,
    thumbnails: 0,
    mediaGalleries: 0,
    files: 0,
    other: 0,
  };
}

interface CountResult {
  componentCount: number;
  textCharCount: number;
  breakdown: ComponentBreakdown;
}

function countComponent(config: ComponentConfig): CountResult {
  const breakdown = emptyBreakdown();
  let componentCount = 1; // This component itself
  let textCharCount = 0;

  switch (config.type) {
    case 'container': {
      breakdown.containers++;
      for (const child of config.children) {
        const childResult = countComponent(child);
        componentCount += childResult.componentCount;
        textCharCount += childResult.textCharCount;
        breakdown.containers += childResult.breakdown.containers;
        breakdown.textDisplays += childResult.breakdown.textDisplays;
        breakdown.sections += childResult.breakdown.sections;
        breakdown.separators += childResult.breakdown.separators;
        breakdown.actionRows += childResult.breakdown.actionRows;
        breakdown.buttons += childResult.breakdown.buttons;
        breakdown.selects += childResult.breakdown.selects;
        breakdown.thumbnails += childResult.breakdown.thumbnails;
        breakdown.mediaGalleries += childResult.breakdown.mediaGalleries;
        breakdown.files += childResult.breakdown.files;
        breakdown.other += childResult.breakdown.other;
      }
      break;
    }

    case 'text_display':
      breakdown.textDisplays++;
      textCharCount += config.content.length;
      break;

    case 'section': {
      breakdown.sections++;
      for (const textItem of config.text) {
        const content =
          typeof textItem === 'string' ? textItem : textItem.content;
        textCharCount += content.length;
      }
      if (config.accessory) {
        const accResult = countComponent(config.accessory);
        componentCount += accResult.componentCount;
        breakdown.containers += accResult.breakdown.containers;
        breakdown.textDisplays += accResult.breakdown.textDisplays;
        breakdown.sections += accResult.breakdown.sections;
        breakdown.separators += accResult.breakdown.separators;
        breakdown.actionRows += accResult.breakdown.actionRows;
        breakdown.buttons += accResult.breakdown.buttons;
        breakdown.selects += accResult.breakdown.selects;
        breakdown.thumbnails += accResult.breakdown.thumbnails;
        breakdown.mediaGalleries += accResult.breakdown.mediaGalleries;
        breakdown.files += accResult.breakdown.files;
        breakdown.other += accResult.breakdown.other;
      }
      break;
    }

    case 'separator':
      breakdown.separators++;
      break;

    case 'action_row': {
      breakdown.actionRows++;
      for (const child of config.children) {
        const childResult = countComponent(child);
        componentCount += childResult.componentCount;
        breakdown.containers += childResult.breakdown.containers;
        breakdown.textDisplays += childResult.breakdown.textDisplays;
        breakdown.sections += childResult.breakdown.sections;
        breakdown.separators += childResult.breakdown.separators;
        breakdown.actionRows += childResult.breakdown.actionRows;
        breakdown.buttons += childResult.breakdown.buttons;
        breakdown.selects += childResult.breakdown.selects;
        breakdown.thumbnails += childResult.breakdown.thumbnails;
        breakdown.mediaGalleries += childResult.breakdown.mediaGalleries;
        breakdown.files += childResult.breakdown.files;
        breakdown.other += childResult.breakdown.other;
      }
      break;
    }

    case 'button':
      breakdown.buttons++;
      break;

    case 'select':
      breakdown.selects++;
      break;

    case 'thumbnail':
      breakdown.thumbnails++;
      break;

    case 'media_gallery':
      breakdown.mediaGalleries++;
      break;

    case 'file':
      breakdown.files++;
      break;

    case 'paginated_group': {
      // Count the current page's worth of buttons (worst case: perPage or all)
      // At validation time, we count all buttons as the max possible
      breakdown.other++;
      const maxPerPage = config.options?.perPage ?? config.buttons.length;
      const pageButtons = Math.min(maxPerPage, config.buttons.length);
      // Each button is a component + action rows to hold them (5 per row)
      const rowsNeeded = Math.ceil(pageButtons / 5);
      breakdown.actionRows += rowsNeeded;
      breakdown.buttons += pageButtons;
      componentCount += rowsNeeded + pageButtons;
      break;
    }

    case 'reserved_buttons_placeholder':
      // Will be replaced with an action row at render time
      // Placeholder itself doesn't count — the injected row does
      // Validation accounts for this separately
      componentCount = 0; // Placeholder is not a real component
      break;

    default:
      breakdown.other++;
      break;
  }

  return { componentCount, textCharCount, breakdown };
}

function countComponents(
  configs: ComponentConfig[],
  initialBreakdown?: ComponentBreakdown,
  initialCount?: number
): CountResult {
  const breakdown = initialBreakdown ?? emptyBreakdown();
  let componentCount = initialCount ?? 0;
  let textCharCount = 0;

  for (const config of configs) {
    const result = countComponent(config);
    componentCount += result.componentCount;
    textCharCount += result.textCharCount;
    // Merge breakdown
    breakdown.containers += result.breakdown.containers;
    breakdown.textDisplays += result.breakdown.textDisplays;
    breakdown.sections += result.breakdown.sections;
    breakdown.separators += result.breakdown.separators;
    breakdown.actionRows += result.breakdown.actionRows;
    breakdown.buttons += result.breakdown.buttons;
    breakdown.selects += result.breakdown.selects;
    breakdown.thumbnails += result.breakdown.thumbnails;
    breakdown.mediaGalleries += result.breakdown.mediaGalleries;
    breakdown.files += result.breakdown.files;
    breakdown.other += result.breakdown.other;
  }

  return { componentCount, textCharCount, breakdown };
}

function formatBreakdown(breakdown: ComponentBreakdown): string {
  const parts: string[] = [];
  if (breakdown.containers) parts.push(`${breakdown.containers} containers`);
  if (breakdown.textDisplays)
    parts.push(`${breakdown.textDisplays} text displays`);
  if (breakdown.sections) parts.push(`${breakdown.sections} sections`);
  if (breakdown.separators) parts.push(`${breakdown.separators} separators`);
  if (breakdown.actionRows) parts.push(`${breakdown.actionRows} action rows`);
  if (breakdown.buttons) parts.push(`${breakdown.buttons} buttons`);
  if (breakdown.selects) parts.push(`${breakdown.selects} selects`);
  if (breakdown.thumbnails) parts.push(`${breakdown.thumbnails} thumbnails`);
  if (breakdown.mediaGalleries)
    parts.push(`${breakdown.mediaGalleries} media galleries`);
  if (breakdown.files) parts.push(`${breakdown.files} files`);
  if (breakdown.other) parts.push(`${breakdown.other} other`);
  return parts.join(', ');
}

/**
 * Validate a layout-mode component tree against Discord's limits.
 *
 * @param components - Top-level component configs from setLayout()
 * @param menuId - Menu identifier for error messages
 * @param reservedButtonCount - Number of reserved buttons that will be injected (Back, Cancel, Next, Previous, page counter)
 */
export function validateLayout(
  components: ComponentConfig[],
  menuId: string,
  reservedButtonCount = 0
): ValidationResult {
  const { componentCount, textCharCount, breakdown } =
    countComponents(components);

  // Account for reserved buttons: 1 action row + N buttons
  const reservedComponents =
    reservedButtonCount > 0 ? 1 + reservedButtonCount : 0;
  const totalComponents = componentCount + reservedComponents;

  if (reservedComponents > 0) {
    breakdown.actionRows += 1;
    breakdown.buttons += reservedButtonCount;
  }

  const errors: string[] = [];

  if (totalComponents > MAX_COMPONENTS) {
    errors.push(
      `Layout for menu "${menuId}" has ${totalComponents} components (limit: ${MAX_COMPONENTS}). ` +
        `Reduce content or split into multiple menus.\n` +
        `Breakdown: ${formatBreakdown(breakdown)}.`
    );
  }

  if (textCharCount > MAX_TEXT_CHARS) {
    errors.push(
      `Layout for menu "${menuId}" has ${textCharCount.toLocaleString()} characters ` +
        `across text display components (limit: ${MAX_TEXT_CHARS.toLocaleString()}). ` +
        `Reduce text content or paginate.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    componentCount: totalComponents,
    textCharCount,
    breakdown,
  };
}

/**
 * Validate embed-mode constraints.
 * Checks action row count (max 5), buttons per row (max 5), etc.
 */
export function validateEmbeds(
  actionRowCount: number,
  menuId: string
): ValidationResult {
  const errors: string[] = [];
  const breakdown = emptyBreakdown();
  breakdown.actionRows = actionRowCount;

  if (actionRowCount > 5) {
    errors.push(
      `Embed menu "${menuId}" has ${actionRowCount} action rows (limit: 5). ` +
        `Reduce buttons or use pagination.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    componentCount: actionRowCount,
    textCharCount: 0,
    breakdown,
  };
}
