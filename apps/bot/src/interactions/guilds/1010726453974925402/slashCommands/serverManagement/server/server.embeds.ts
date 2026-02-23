import { EmbedBuilder } from 'discord.js';

import type { AdminMenu, MenuCommandOptions } from '@bot/classes';

export const getServerMenuEmbeds = async <
  C extends MenuCommandOptions = MenuCommandOptions
>(
  menu: AdminMenu<C>,
  defaultPrompt = 'Please select an option to manage your server settings.'
) => {
  const server = await menu.getServer();
  const prompt = menu.prompt || defaultPrompt;

  const prefixes: string =
    server.prefixes && server.prefixes.length > 0
      ? server.prefixes.map((prefix) => `\`${prefix}\``).join(', ')
      : '`.` (default)';

  const adminRoles = await menu.getRoles('admin');
  const adminRolesList: string = adminRoles.length
    ? adminRoles.join(', ')
    : 'None';
  const modRoles = await menu.getRoles('mod');
  const modRolesList: string = modRoles.length ? modRoles.join(', ') : 'None';

  return [
    new EmbedBuilder()
      .setColor('Gold')
      .setAuthor({
        name: `${server.name} Server Options`,
        iconURL: menu.interaction.guild?.iconURL() || undefined,
      })
      .setDescription(
        `${prompt ? '**' + prompt + '**\n\n' : ''}` +
          `:one: Update Bot Prefixes: ${prefixes}` +
          `\n:two: Update Admin Roles: ${adminRolesList}` +
          `\n:three: Update Mod Roles: ${modRolesList}` +
          `\n:four: ${
            server.discovery.enabled
              ? 'Modify Server Discovery Settings'
              : 'Enable Server Discovery'
          }`
      )
      .setTimestamp(),
  ];
};
