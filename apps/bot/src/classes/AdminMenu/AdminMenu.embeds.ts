import { EmbedBuilder } from 'discord.js';

import type { AdminMenu, MenuCommandOptions } from '@bot/classes';

export const getServerInitializedEmbed = async <
  C extends MenuCommandOptions = MenuCommandOptions
>(
  menu: AdminMenu<C>
) => {
  const server = await menu.getServer();
  return new EmbedBuilder()
    .setColor('Gold')
    .setAuthor({
      name: `${server.name} Initialized!`,
      iconURL: menu.interaction.guild?.iconURL() || undefined,
    })
    .setDescription(
      `Congratulations, your server has been initialized with PokeSandbox!\n` +
        `\nBelow are some basic commands that will be helpful for getting your server setup and starting with creating your first region:` +
        `\n\`/server\`: Use this command at any time to open up the below options menu and update your PokeSandbox server settings.` +
        `\n\`/regions\`: Use this command to create a new region for your server, or to update existing regions.`
    )
    .setTimestamp();
};
