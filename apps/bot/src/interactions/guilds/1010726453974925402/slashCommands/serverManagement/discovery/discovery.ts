import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import {
  AdminMenu,
  AdminMenuBuilder,
  MenuButtonConfig,
  MenuWorkflow,
} from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';

import getDiscoveryMenuEmbeds from './discovery.embeds';
import { DISCOVERY_DESCRIPTION_COMMAND_NAME } from './discoveryDescription';

const COMMAND_NAME = 'discovery';
export const DISCOVERY_COMMAND_NAME = COMMAND_NAME;

export const DiscoveryCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Update your server discovery settings')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session): Promise<AdminMenu> =>
    new AdminMenuBuilder(session, COMMAND_NAME)
      .setButtons(getDiscoveryButtons)
      .setEmbeds(getDiscoveryMenuEmbeds)
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build(),
} as ISlashCommand<any>;

async function getDiscoveryButtons(
  menu: AdminMenu
): Promise<MenuButtonConfig[]> {
  const server = await menu.fetchServer();

  return [
    {
      disabled: !server.discovery.enabled && !server.discovery.description,
      label: server.discovery.enabled ? 'Disable' : 'Enable',
      style: server.discovery.enabled
        ? ButtonStyle.Danger
        : ButtonStyle.Success,
      onClick: async () => {
        server.discovery.enabled = !server.discovery.enabled;
        await server.save();
        await menu.refresh();
      },
    },
    {
      label: 'Set Description',
      style: ButtonStyle.Primary,
      onClick: async (menu: AdminMenu) =>
        MenuWorkflow.openMenu(menu, DISCOVERY_DESCRIPTION_COMMAND_NAME),
    },
  ];
}
