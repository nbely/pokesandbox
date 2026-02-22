import { EmbedBuilder } from 'discord.js';

import type { AdminMenu, MenuCommandOptions } from '@bot/classes';
import { ProgressionDefinition } from '@shared';

import { buildMilestoneListField } from '../progression.embeds';
import { assertProgressionKind } from '../utils';

export const milestonesMenuEmbeds = async <
  C extends MenuCommandOptions = MenuCommandOptions
>(
  menu: AdminMenu<C>,
  progression: ProgressionDefinition
) => {
  assertProgressionKind(progression, 'milestone');

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
