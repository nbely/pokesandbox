import { EmbedBuilder } from 'discord.js';

import type { AdminMenuBuilder } from '@bot/classes';

const getDiscoveryMenuEmbed = async (menu: AdminMenuBuilder) => {
  return new EmbedBuilder()
    .setColor('Gold')
    .setAuthor({
      name: `${menu.server.name} Discovery Settings:`,
      iconURL: menu.componentInteraction?.guild?.iconURL() ?? undefined,
    })
    .setDescription(`${menu.prompt ? '' + menu.prompt + '\n\n' : ''}`)
    .addFields(
      {
        name: 'Status:',
        value: menu.server.discovery.enabled ? 'Enabled' : 'Disabled',
      },
      {
        name: 'Server Description:',
        value: menu.server.discovery.description || 'None',
      }
    )
    .setTimestamp();
};

export default getDiscoveryMenuEmbed;
