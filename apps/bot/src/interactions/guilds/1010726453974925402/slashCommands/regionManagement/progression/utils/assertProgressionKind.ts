import type { ProgressionDefinition } from '@shared';

export const assertProgressionKind: <K extends ProgressionDefinition['kind']>(
  progression: ProgressionDefinition,
  expectedKind: K
) => asserts progression is Extract<ProgressionDefinition, { kind: K }> = (
  progression,
  expectedKind
) => {
  if (progression.kind !== expectedKind) {
    throw new Error(
      `Expected progression kind to be ${expectedKind}, but got ${progression.kind}`
    );
  }
};
