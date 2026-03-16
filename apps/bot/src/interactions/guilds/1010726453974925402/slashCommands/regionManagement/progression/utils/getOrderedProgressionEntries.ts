import type { ProgressionDefinition } from '@shared/models';

export type ProgressionEntry = [string, ProgressionDefinition];

const progressionKindOrder: Record<ProgressionDefinition['kind'], number> = {
  milestone: 0,
  numeric: 1,
  boolean: 2,
};

export const getOrderedProgressionEntries = (
  progressionDefinitions: Map<string, ProgressionDefinition>
): ProgressionEntry[] => {
  return Array.from(progressionDefinitions.entries()).sort((a, b) => {
    const kindOrderDifference =
      progressionKindOrder[a[1].kind] - progressionKindOrder[b[1].kind];

    if (kindOrderDifference !== 0) {
      return kindOrderDifference;
    }

    return a[1].name.localeCompare(b[1].name, undefined, {
      sensitivity: 'base',
    });
  });
};