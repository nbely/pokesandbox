import { InteractionContextType, SlashCommandBuilder } from 'discord.js';

import { saveServer } from '@bot/cache';
import { AdminMenuBuilderV2, type AdminMenuContext } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';

import { getServerMenuEmbeds } from './server.embeds';
import { SERVER_MANAGE_PREFIXES_COMMAND_NAME } from './serverManagePrefixes';

const COMMAND_NAME = 'server-add-prefix';
export const SERVER_ADD_PREFIX_COMMAND_NAME = COMMAND_NAME;

export const ServerAddPrefixCommand: ISlashCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Add a new command prefix to your server')
    .setContexts(InteractionContextType.Guild),
  createMenuV2: (session) =>
    new AdminMenuBuilderV2(session, COMMAND_NAME)
      .setEmbeds((ctx) =>
        getServerMenuEmbeds(
          ctx,
          'Please enter a new prefix to use with this bot on your server.'
        )
      )
      .setMessageHandler(async (ctx: AdminMenuContext, response: string) => {
        const server = await ctx.admin.getServer();

        if (!server.prefixes.includes(response)) {
          server.prefixes = [...server.prefixes, response];
          await saveServer(server);
          ctx.state.set(
            'prompt',
            `Successfully added the prefix: \`${response}\``
          );
        } else {
          ctx.state.set(
            'prompt',
            'Oops! The entered prefix already exists for this server.'
          );
        }
        await ctx.goBack();
      })
      .setFallbackMenu(SERVER_MANAGE_PREFIXES_COMMAND_NAME)
      .build(),
};
