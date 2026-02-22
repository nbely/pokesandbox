import type { AdminMenu } from '@bot/classes';
import type { ProgressionDefinition, Region } from '@shared';

import type {
  EditProgressionFieldConfig,
  ProgressionEditCommandOptions,
} from '../types';

export const handleEditProgressionField = async (
  menu: AdminMenu<ProgressionEditCommandOptions>,
  config: EditProgressionFieldConfig,
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
