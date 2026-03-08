/**
 * Sorts an array of items by their `ordinal` field in ascending order.
 * Items without an `ordinal` value are placed at the end.
 * Does not mutate the original array.
 */
export function sortByOrdinal<T extends { ordinal?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.ordinal != null && b.ordinal != null) {
      return a.ordinal - b.ordinal;
    } else if (a.ordinal != null) {
      return -1;
    } else if (b.ordinal != null) {
      return 1;
    } else {
      return 0;
    }
  });
}
