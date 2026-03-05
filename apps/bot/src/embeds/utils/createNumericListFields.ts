import {
  getNumericEmojiLabel,
  getNumericEmojiPaddingRules,
} from './numericEmojis';
import { splitColumnItemsEvenly } from './splitColumnItemsEvenly';

/**
 * Creates numeric emoji-labeled embed fields from a list of items.
 * @param items - Array of item names to display
 * @param columnCountRules - Rules to determine column count based on item count thresholds
 * @param noItemsMessage - Message to display when the items array is empty
 * @returns Array of embed fields with numeric emoji labels and values split across columns
 */
export function createNumericListFields(
  items: string[],
  columnCountRules: { threshold: number; columns: number }[],
  noItemsMessage = 'No items found.'
): { name: string; value: string; inline: boolean }[] {
  let columnsCount = 1;
  for (const rule of columnCountRules) {
    if (items.length >= rule.threshold) {
      columnsCount = rule.columns;
    } else {
      break;
    }
  }

  const indexedItems = items.map((name, index) => ({ name, index }));
  const itemColumns = splitColumnItemsEvenly(indexedItems, columnsCount);

  return items.length > 0
    ? itemColumns.map((column) => {
        const { padSingle, padDouble } = getNumericEmojiPaddingRules(column);

        return {
          name: '\u200b',
          value: column
            .map(
              ({ name, index }) =>
                `${getNumericEmojiLabel(index, padSingle, padDouble)} ${name}`
            )
            .join('\n'),
          inline: true,
        };
      })
    : [{ name: noItemsMessage, value: '\u200b', inline: false }];
}
