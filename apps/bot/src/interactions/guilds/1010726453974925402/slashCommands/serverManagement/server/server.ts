import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { AdminMenu, AdminMenuBuilder, MenuButtonConfig } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles, openMenu } from '@bot/utils';

import { DISCOVERY_COMMAND_NAME } from '../discovery/discovery';
import { getServerMenuEmbeds } from './server.embeds';
import { SERVER_MANAGE_PREFIXES_COMMAND_NAME } from './serverManagePrefixes';
import { SERVER_MANAGE_ROLES_COMMAND_NAME } from './serverManageRoles';

const COMMAND_NAME = 'server';
export const SERVER_COMMAND_NAME = COMMAND_NAME;

export const ServerCommand: ISlashCommand<AdminMenu> = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Update your PokeSandbox server settings')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session): Promise<AdminMenu> =>
    new AdminMenuBuilder(session, COMMAND_NAME)
      .setButtons(getServerButtons)
      .setEmbeds(getServerMenuEmbeds)
      .setCancellable()
      .setTrackedInHistory()
      .build(),
};

const getServerButtons = async (): Promise<MenuButtonConfig<AdminMenu>[]> => {
  const subMenuButtons: { id: string; command: string; options?: string[] }[] =
    [
      { id: 'Prefix', command: SERVER_MANAGE_PREFIXES_COMMAND_NAME },
      {
        id: 'Admin',
        command: SERVER_MANAGE_ROLES_COMMAND_NAME,
        options: ['admin'],
      },
      {
        id: 'Mod',
        command: SERVER_MANAGE_ROLES_COMMAND_NAME,
        options: ['mod'],
      },
      { id: 'Discovery', command: DISCOVERY_COMMAND_NAME },
    ];

  return subMenuButtons.map(({ id, command, options }, idx) => ({
    label: (idx + 1).toString(),
    id,
    style: ButtonStyle.Primary,
    onClick: async (menu) => openMenu(menu, command, ...options),
  }));
};
