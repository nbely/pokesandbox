import { EmbedBuilder } from 'discord.js';

import type { AdminMenuBuilder } from '@bot/classes';

const getServerMenuEmbed = (menu: AdminMenuBuilder) => {
  const prefixes: string =
    menu.server.prefixes && menu.server.prefixes.length > 0
      ? menu.server.prefixes.map((prefix) => `\`${prefix}\``).join(', ')
      : '`.` (default)';

  const adminRolesList: string = menu.adminRoles
    ? menu.adminRoles?.join(', ')
    : 'None';

  const modRolesList: string = menu.modRoles
    ? menu.modRoles?.join(', ')
    : 'None';

  return new EmbedBuilder()
    .setColor('Gold')
    .setAuthor({
      name: `${menu.server.name} Server Options:`,
      iconURL: menu.commandInteraction.guild?.iconURL() || undefined,
    })
    .setDescription(
      `${menu.prompt ? '**' + menu.prompt + '**\n\n' : ''}` +
        `:one: Update Bot Prefixes: ${prefixes}` +
        `\n:two: Update Admin Roles: ${adminRolesList}` +
        `\n:three: Update Mod Roles: ${modRolesList}` +
        `\n:four: ${
          menu.server.discovery.enabled
            ? 'Modify Server Discovery Settings'
            : 'Enable Server Discovery'
        }`
    )
    .setTimestamp();
};

export default getServerMenuEmbed;
