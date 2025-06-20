import { AdminMenu, AdminMenuBuilder } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { Server } from '@shared/models';
import { findServer, upsertServer } from '@shared/services';

import getDiscoveryMenuEmbeds from './discovery.embeds';

import { SlashCommandBuilder } from 'discord.js';

const COMMAND_NAME = 'discovery-description';
export const DISCOVERY_DESCRIPTION_COMMAND_NAME = COMMAND_NAME;

export const DiscoveryDescriptionCommand: ISlashCommand<AdminMenu> = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: async (guildId: string): Promise<string[]> => {
    const server: Server | null = await findServer({ serverId: guildId });
    if (!server?.adminRoleIds) return [];
    return server.adminRoleIds;
  },
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Update your server discovery description')
    .setDMPermission(false),
  createMenu: async (session): Promise<AdminMenu> =>
    new AdminMenuBuilder(session, COMMAND_NAME)
      .setEmbeds(getDiscoveryMenuEmbeds)
      .setMessageHandler(async (menu: AdminMenu, response: string) => {
        const server = await menu.fetchServer();
        server.discovery.description = response;

        await upsertServer({ serverId: server.serverId }, server);
        await menu.session.goBack();
        menu.prompt = `Successfully updated the server description.`;
      })
      .build(),
};
