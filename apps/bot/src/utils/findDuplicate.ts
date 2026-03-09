type FieldCheck<T> = {
  /** The value from the submitted input to compare against */
  value: unknown;
  /** Extracts the comparable value from an existing item */
  getValue: (item: T) => unknown;
  /** Error message, or a function that receives the conflicting item to build one */
  message: string | ((item: T) => string);
  /** When true this field check is skipped entirely (e.g. ordinal was not provided) */
  skip?: boolean;
};

/**
 * Scans `items` in a single pass, checking each active `FieldCheck` in order.
 * Returns the first error message found, or `undefined` when there are no conflicts.
 *
 * @param items - The existing records to check against
 * @param checks - Ordered list of field checks to perform
 * @param excludeId - Optional record id to skip (used when editing an existing item)
 */
export function findDuplicate<T extends { _id: { toString(): string } }>(
  items: T[],
  checks: FieldCheck<T>[],
  excludeId?: string
): string | undefined {
  const activeChecks = checks.filter((c) => !c.skip);
  for (const item of items) {
    if (excludeId && item._id.toString() === excludeId) continue;
    for (const check of activeChecks) {
      if (check.value === check.getValue(item)) {
        return typeof check.message === 'function' ? check.message(item) : check.message;
      }
    }
  }
  return undefined;
}
