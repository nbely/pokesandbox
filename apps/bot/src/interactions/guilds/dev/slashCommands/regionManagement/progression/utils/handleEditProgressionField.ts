import assert from 'node:assert';

import { saveRegion } from '@bot/cache';
import type { AdminMenuContext } from '@bot/classes';

import type {
  EditProgressionFieldConfig,
  ProgressionEditMenuState,
} from '../types';

export const handleEditProgressionField = async (
  ctx: AdminMenuContext<ProgressionEditMenuState>,
  config: EditProgressionFieldConfig,
  regionId: string,
  progressionKey: string,
  response: string
) => {
  const region = await ctx.admin.getRegion(regionId);
  const progression = region.progressionDefinitions.get(progressionKey);
  assert(progression, 'Progression definition not found');

  config.handleInput(progression, response);
  region.progressionDefinitions.set(progressionKey, progression);
  await saveRegion(region);

  ctx.sessionState.set('progressionEditField', undefined);
  await ctx.hardRefresh();
};
