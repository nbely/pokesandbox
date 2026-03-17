import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { saveServer } from '@bot/cache';
import { AdminMenuBuilder, type AdminMenuContext } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';
import type { ButtonInputConfig } from '@flowcord';

import getDiscoveryMenuEmbeds from './discovery.embeds';
import { DISCOVERY_DESCRIPTION_COMMAND_NAME } from './discoveryDescription';

const COMMAND_NAME = 'discovery';
export const DISCOVERY_COMMAND_NAME = COMMAND_NAME;

export const DiscoveryCommand: ISlashCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Update your server discovery settings')
    .setContexts(InteractionContextType.Guild),
  createMenu: (session) =>
    new AdminMenuBuilder(session, COMMAND_NAME)
      .setButtons(getDiscoveryButtons)
      .setEmbeds(getDiscoveryMenuEmbeds)
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build(),
};

async function getDiscoveryButtons(
  ctx: AdminMenuContext
): Promise<ButtonInputConfig<AdminMenuContext>[]> {
  const server = await ctx.admin.getServer();

  return [
    {
      disabled: !server.discovery.enabled && !server.discovery.description,
      label: server.discovery.enabled ? 'Disable' : 'Enable',
      style: server.discovery.enabled
        ? ButtonStyle.Danger
        : ButtonStyle.Success,
      action: async (ctx: AdminMenuContext) => {
        const server = await ctx.admin.getServer();
        server.discovery.enabled = !server.discovery.enabled;
        await saveServer(server);
      },
    },
    {
      label: 'Set Description',
      style: ButtonStyle.Primary,
      action: async (ctx: AdminMenuContext) =>
        ctx.goTo(DISCOVERY_DESCRIPTION_COMMAND_NAME),
    },
  ];
}
