import type { AdminMenu } from '@bot/classes';
import type { ProgressionDefinition, Region } from '@shared';

import type {
  EditFieldConfig,
  EditProgressionDefinitionCommandOptions,
} from './types';

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

export const handleEditProgressionField = async (
  menu: AdminMenu<EditProgressionDefinitionCommandOptions>,
  config: EditFieldConfig,
  region: Region,
  progressionKey: string,
  progression: ProgressionDefinition,
  response: string
) => {
  config.handleInput(progression, response);
  region.progressionDefinitions.set(progressionKey, progression);
  await region.save();

  menu.session.deleteState('progressionEditField');
  await menu.hardRefresh();
};
