import type { ProgressionDefinition } from '@shared/models';

export const assertProgressionKind: <K extends ProgressionDefinition['kind']>(
  expectedKind: K,
  progression?: ProgressionDefinition
) => asserts progression is Extract<ProgressionDefinition, { kind: K }> = (
  expectedKind,
  progression
) => {
  if (!progression) {
    throw new Error('Progression definition not found.');
  }
  if (progression.kind !== expectedKind) {
    throw new Error(
      `Expected progression kind to be ${expectedKind}, but got ${progression.kind}`
    );
  }
};
