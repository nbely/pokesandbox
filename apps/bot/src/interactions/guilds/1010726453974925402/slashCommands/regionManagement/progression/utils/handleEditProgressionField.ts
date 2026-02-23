import assert from 'node:assert';

import { saveRegion } from '@bot/cache';
import type { AdminMenu } from '@bot/classes';

import type {
  EditProgressionFieldConfig,
  ProgressionEditCommandOptions,
} from '../types';

export const handleEditProgressionField = async (
  menu: AdminMenu<ProgressionEditCommandOptions>,
  config: EditProgressionFieldConfig,
  regionId: string,
  progressionKey: string,
  response: string
) => {
  const region = await menu.getRegion(regionId);
  const progression = region.progressionDefinitions.get(progressionKey);
  assert(progression, 'Progression definition not found');

  config.handleInput(progression, response);
  region.progressionDefinitions.set(progressionKey, progression);
  await saveRegion(region);

  menu.session.deleteState('progressionEditField');
  await menu.hardRefresh();
};
