import pluralize from 'pluralize';

type PaginationLike = {
  startIndex: number;
  endIndex: number;
};

type PaginatedListResult<T> = {
  totalItems: number;
  startIndex: number;
  endIndexExclusive: number;
  visibleItems: T[];
  footerText?: string;
};

type PaginateListForButtonPaginationOptions = {
  itemLabel: string;
};

/**
 * Applies FlowCord button pagination indices to a list displayed in embeds.
 * Expects `startIndex`/`endIndex` semantics where `endIndex` is exclusive.
 */
export const paginateListForButtonPagination = <T>(
  items: T[],
  pagination?: PaginationLike | null,
  options?: PaginateListForButtonPaginationOptions
): PaginatedListResult<T> => {
  const totalItems = items.length;
  const rawStart = pagination?.startIndex ?? 0;
  const rawEndExclusive = pagination?.endIndex ?? totalItems;

  const startIndex = Math.max(0, Math.min(rawStart, totalItems));
  const endIndexExclusive = Math.max(
    startIndex,
    Math.min(rawEndExclusive, totalItems)
  );

  const startDisplay = totalItems > 0 ? startIndex + 1 : 0;
  const endDisplay = totalItems > 0 ? endIndexExclusive : 0;
  const itemLabel = options?.itemLabel;

  const footerText =
    itemLabel && totalItems > 0
      ? startDisplay === endDisplay
        ? `Showing ${itemLabel} ${startDisplay} of ${totalItems}`
        : `Showing ${pluralize(
            itemLabel
          )} ${startDisplay}-${endDisplay} of ${totalItems}`
      : undefined;

  return {
    totalItems,
    startIndex,
    endIndexExclusive,
    visibleItems: items.slice(startIndex, endIndexExclusive),
    footerText,
  };
};
