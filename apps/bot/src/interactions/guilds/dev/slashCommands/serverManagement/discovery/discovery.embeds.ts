import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';

import type { AdminMenuContext } from '@bot/classes';

const getDiscoveryMenuEmbeds = async (
  ctx: AdminMenuContext,
  defaultPrompt = 'Please enter a new server description to be displayed on the server discovery page.'
) => {
  const prompt = (ctx.state.get('prompt') as string) || defaultPrompt;
  const server = await ctx.admin.getServer();
  const interaction = ctx.interaction as ChatInputCommandInteraction;

  return [
    new EmbedBuilder()
      .setColor('Gold')
      .setAuthor({
        name: `${server.name} Discovery Settings`,
        iconURL: interaction.guild?.iconURL() ?? undefined,
      })
      .setDescription(`${prompt ? '' + prompt + '\n\n' : ''}`)
      .addFields(
        {
          name: 'Status:',
          value: server.discovery.enabled ? 'Enabled' : 'Disabled',
        },
        {
          name: 'Server Description:',
          value: server.discovery.description || 'None',
        }
      )
      .setTimestamp(),
  ];
};

export default getDiscoveryMenuEmbeds;
