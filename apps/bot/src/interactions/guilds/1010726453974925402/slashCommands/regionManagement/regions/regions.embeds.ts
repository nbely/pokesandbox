import { EmbedBuilder } from 'discord.js';

import type { AdminMenuContext } from '@bot/classes';

import { RegionsMenuState } from './types';

export const getRegionsMenuEmbeds = async (
  ctx: AdminMenuContext<RegionsMenuState>,
  defaultPrompt = 'Please select a Region to manage.'
): Promise<EmbedBuilder[]> => {
  const server = await ctx.admin.getServer();
  const regions = await ctx.admin.getRegions();

  const prompt = ctx.state.get('prompt') || defaultPrompt;
  const firstRegionDescription =
    `Hello! It appears that this is your first region on this server.` +
    `\n\nClick the **Create Region** button to open the modal, then confirm your new region name.` +
    `\n\nAfter creating it, click the button with your new region's name to start managing that region's settings.` +
    `\n\nYou can always use the \`/regions\` command to return here and manage your regions.` +
    `\n\nRegions settings that are required before being able to deploy your region live will be bolded and italicized until they have satisfied the minimum requirements.` +
    `\n\nIf you need any help, you can always use the \`/help\` command to get a list of all available commands, refer to to official PokéSandbox setup guide (https://pokesandbox.com/setup), or use the \`/support\` command to get a link to the support server.` +
    `\n\nAnd last but not least, have fun! We look forward to seeing what you create!`;
  const addtionalRegionDescription =
    `${prompt ? '**' + prompt + '**\n\n' : ''}` +
    regions.map((region) => `${region.name}: Inactive`).join('\n');

  return [
    new EmbedBuilder()
      .setColor('Gold')
      .setAuthor({
        name: `${server.name} Region Manager`,
        iconURL: ctx.interaction.guild?.iconURL() || undefined,
      })
      .setDescription(
        regions.length === 0
          ? firstRegionDescription
          : addtionalRegionDescription
      )
      .setTimestamp(),
  ];
};
