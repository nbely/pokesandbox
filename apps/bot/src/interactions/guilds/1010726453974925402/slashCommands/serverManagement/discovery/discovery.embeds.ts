import { EmbedBuilder } from 'discord.js';

import type { AdminMenu } from '@bot/classes';

const getDiscoveryMenuEmbeds = async (
  menu: AdminMenu,
  defaultPrompt = 'Please enter a new server description to be displayed on the server discovery page.'
) => {
  const prompt = menu.prompt || defaultPrompt;
  const server = await menu.getServer();

  return [
    new EmbedBuilder()
      .setColor('Gold')
      .setAuthor({
        name: `${server.name} Discovery Settings`,
        iconURL: menu.interaction?.guild?.iconURL() ?? undefined,
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
