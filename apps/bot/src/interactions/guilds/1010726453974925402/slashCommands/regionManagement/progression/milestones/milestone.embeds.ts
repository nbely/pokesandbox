import { EmbedBuilder } from 'discord.js';

import type { AdminMenu, MenuCommandOptions } from '@bot/classes';

import { buildMilestoneListField } from '../progression.embeds';
import { assertProgressionKind } from '../utils';

export const milestonesMenuEmbeds = async <
  C extends MenuCommandOptions = MenuCommandOptions
>(
  menu: AdminMenu<C>,
  regionId: string,
  progressionKey: string
) => {
  const region = await menu.getRegion(regionId);
  const progression = await region.progressionDefinitions.get(progressionKey);
  assertProgressionKind('milestone', progression);

  const embed = new EmbedBuilder()
    .setTitle(`${progression.name} Milestones`)
    .setDescription(
      'Add a new milestone to this progression, or select an existing one to edit or delete.'
    )
    .addFields([buildMilestoneListField(progression)]);

  if (menu.warningMessage) {
    embed.setFooter({ text: menu.warningMessage });
  }

  return [embed];
};
