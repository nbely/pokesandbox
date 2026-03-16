import { EmbedBuilder } from 'discord.js';

import type { AdminMenuContext } from '@bot/classes';

import { buildMilestoneListFields } from '../progression.embeds';
import { assertProgressionKind } from '../utils';
import type { MilestonesMenuState } from './types';

export const milestonesMenuEmbeds = async (
  ctx: AdminMenuContext<MilestonesMenuState>,
  regionId: string,
  progressionKey: string
) => {
  const region = await ctx.admin.getRegion(regionId);
  const progression = region.progressionDefinitions.get(progressionKey);
  assertProgressionKind('milestone', progression);

  const embed = new EmbedBuilder()
    .setTitle(`${progression.name} Milestones`)
    .setDescription(
      'Add a new milestone to this progression, or select an existing one to edit or delete.'
    )
    .addFields(buildMilestoneListFields(progression, true));

  const warningMessage = ctx.state.get('warningMessage');
  if (warningMessage) {
    embed.setFooter({ text: warningMessage });
  }

  return [embed];
};
