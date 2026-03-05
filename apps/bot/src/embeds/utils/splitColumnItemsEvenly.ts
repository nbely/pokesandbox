export const splitColumnItemsEvenly = <T>(
  items: T[],
  columns: number
): T[][] => {
  const safeColumns = Math.max(1, Math.min(columns, items.length || 1));
  const baseSize = Math.floor(items.length / safeColumns);
  const remainder = items.length % safeColumns;

  const result: T[][] = [];
  let start = 0;

  for (let col = 0; col < safeColumns; col++) {
    const size = baseSize + (col < remainder ? 1 : 0);
    result.push(items.slice(start, start + size));
    start += size;
  }

  return result;
};
