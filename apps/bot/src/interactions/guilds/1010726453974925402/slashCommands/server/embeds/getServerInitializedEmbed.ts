import { EmbedBuilder } from 'discord.js';

import type { AdminMenuBuilder } from '@bot/classes';

const getServerInitializedEmbed = (menu: AdminMenuBuilder) => {
  return new EmbedBuilder()
    .setColor('Gold')
    .setAuthor({
      name: `${menu.server.name} Initialized!`,
      iconURL: menu.commandInteraction.guild?.iconURL() || undefined,
    })
    .setDescription(
      `Congratulations, your server has been initialized with PokeSandbox!\n` +
        `\nBelow are some basic commands that will be helpful for getting your server setup and starting with creating your first region:` +
        `\n\`/server\`: Use this command at any time to open up the below options menu and update your PokeSandbox server settings.` +
        `\n\`/regions\`: Use this command to create a new region for your server, or to update existing regions.`
    )
    .setTimestamp();
};

export default getServerInitializedEmbed;
