import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';

import type { AdminMenuContext } from '@bot/classes';

export const getServerMenuEmbeds = async (
  ctx: AdminMenuContext,
  defaultPrompt = 'Please select an option to manage your server settings.'
) => {
  const server = await ctx.admin.getServer();
  const prompt = (ctx.state.get('prompt') as string) || defaultPrompt;
  const interaction = ctx.interaction as ChatInputCommandInteraction;

  const prefixes: string =
    server.prefixes && server.prefixes.length > 0
      ? server.prefixes.map((prefix) => `\`${prefix}\``).join(', ')
      : '`.` (default)';

  const adminRoles = await ctx.admin.getRoles('admin');
  const adminRolesList: string = adminRoles.length
    ? adminRoles.join(', ')
    : 'None';
  const modRoles = await ctx.admin.getRoles('mod');
  const modRolesList: string = modRoles.length ? modRoles.join(', ') : 'None';

  return [
    new EmbedBuilder()
      .setColor('Gold')
      .setAuthor({
        name: `${server.name} Server Options`,
        iconURL: interaction.guild?.iconURL() || undefined,
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
