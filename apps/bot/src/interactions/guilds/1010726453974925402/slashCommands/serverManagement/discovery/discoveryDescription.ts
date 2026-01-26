import { InteractionContextType, SlashCommandBuilder } from 'discord.js';

import { AdminMenu, AdminMenuBuilder } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';

import getDiscoveryMenuEmbeds from './discovery.embeds';

const COMMAND_NAME = 'discovery-description';
export const DISCOVERY_DESCRIPTION_COMMAND_NAME = COMMAND_NAME;

export const DiscoveryDescriptionCommand: ISlashCommand<AdminMenu> = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Update your server discovery description')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session): Promise<AdminMenu> =>
    new AdminMenuBuilder(session, COMMAND_NAME)
      .setEmbeds(getDiscoveryMenuEmbeds)
      .setMessageHandler(async (menu: AdminMenu, response: string) => {
        const server = await menu.fetchServer();
        server.discovery.description = response;

        await server.save();
        await menu.session.goBack();
        menu.prompt = `Successfully updated the server description.`;
      })
      .build(),
};
