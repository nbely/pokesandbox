import { EmbedBuilder } from 'discord.js';

import type { AdminMenu } from '@bot/classes';

export const getRegionsMenuEmbeds = async (
  menu: AdminMenu,
  defaultPrompt = 'Please select a Region to manage.'
): Promise<EmbedBuilder[]> => {
  const server = await menu.getServer();
  const regions = await menu.getRegions();
  const prompt = menu.prompt || defaultPrompt;

  return [
    new EmbedBuilder()
      .setColor('Gold')
      .setAuthor({
        name: `${server.name} Region Manager`,
        iconURL: menu.interaction.guild?.iconURL() || undefined,
      })
      .setDescription(
        `${prompt ? '**' + prompt + '**\n\n' : ''}` +
          regions.map((region) => `${region.name}: Inactive`).join('\n')
      )
      .setTimestamp(),
  ];
};

export const getCreateFirstRegionEmbeds = async (
  menu: AdminMenu
): Promise<EmbedBuilder[]> => {
  return [
    new EmbedBuilder()
      .setColor('Gold')
      .setAuthor({
        name: `Let's create your first region!`,
        iconURL: menu.interaction.guild?.iconURL() || undefined,
      })
      .setDescription(
        `Hello! It appears that this is your first region that you are creating on this server. I'll start by asking, what is the name of your new region?` +
          `\n\nOnce you've decided, you'll be able to use the \`/regions\` command to update your region's settings.` +
          `\n\nRegions settings that are required before being able to deploy your region live will be bolded and italicized until they have satisfied the minimum requirements.` +
          `\n\nIf you need any help, you can always use the \`/help\` command to get a list of all available commands, refer to to official PokéSandbox setup guide (https://pokesandbox.com/setup), or use the \`/support\` command to get a link to the support server.` +
          `\n\nAnd last but not least, have fun! We look forward to seeing what you create!`
      )
      .setTimestamp(),
  ];
};
