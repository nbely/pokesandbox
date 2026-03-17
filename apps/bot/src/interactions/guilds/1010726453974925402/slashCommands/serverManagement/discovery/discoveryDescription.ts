import { InteractionContextType, SlashCommandBuilder } from 'discord.js';

import { saveServer } from '@bot/cache';
import { AdminMenuBuilder, type AdminMenuContext } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';

import { DISCOVERY_COMMAND_NAME } from './discovery';
import getDiscoveryMenuEmbeds from './discovery.embeds';

const COMMAND_NAME = 'discovery-description';
export const DISCOVERY_DESCRIPTION_COMMAND_NAME = COMMAND_NAME;

export const DiscoveryDescriptionCommand: ISlashCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Update your server discovery description')
    .setContexts(InteractionContextType.Guild),
  createMenu: (session) =>
    new AdminMenuBuilder(session, COMMAND_NAME)
      .setEmbeds(getDiscoveryMenuEmbeds)
      .setMessageHandler(async (ctx: AdminMenuContext, response: string) => {
        const server = await ctx.admin.getServer();
        server.discovery.description = response;

        await saveServer(server);
        ctx.state.set('prompt', 'Successfully updated the server description.');
        await ctx.goBack();
      })
      .setFallbackMenu(DISCOVERY_COMMAND_NAME)
      .build(),
};
