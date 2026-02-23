import { InteractionContextType, SlashCommandBuilder } from 'discord.js';

import { saveServer } from '@bot/cache';
import { AdminMenuBuilder, type AdminMenu } from '@bot/classes';
import { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';

import { getServerMenuEmbeds } from './server.embeds';

const COMMAND_NAME = 'server-add-prefix';
export const SERVER_ADD_PREFIX_COMMAND_NAME = COMMAND_NAME;

export const ServerAddPrefixCommand: ISlashCommand<AdminMenu> = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Add a new command prefix to your server')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session): Promise<AdminMenu> =>
    new AdminMenuBuilder(session, COMMAND_NAME)
      .setEmbeds((menu) =>
        getServerMenuEmbeds(
          menu,
          'Please enter a new prefix to use with this bot on your server.'
        )
      )
      .setMessageHandler(async (menu, response) => {
        const server = await menu.getServer();

        try {
          if (!server.prefixes.includes(response)) {
            server.prefixes = [...server.prefixes, response];
            await saveServer(server);
            menu.prompt = `Successfully added the prefix: \`${response}\``;
          } else {
            menu.prompt =
              'Oops! The entered prefix already exists for this server.';
          }
        } catch (error) {
          await menu.session.handleError(error);
        }
        await menu.session.goBack();
      })
      .setTrackedInHistory()
      .build(),
};
