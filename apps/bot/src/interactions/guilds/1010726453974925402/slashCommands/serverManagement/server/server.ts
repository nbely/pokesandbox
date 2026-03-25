import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { AdminMenuBuilder, type AdminMenuContext } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';
import type { ButtonInputConfig } from '@flowcord/core';

import { DISCOVERY_COMMAND_NAME } from '../discovery/discovery';
import { getServerMenuEmbeds } from './server.embeds';
import { SERVER_MANAGE_PREFIXES_COMMAND_NAME } from './serverManagePrefixes';
import { SERVER_MANAGE_ROLES_COMMAND_NAME } from './serverManageRoles';

const COMMAND_NAME = 'server';
export const SERVER_COMMAND_NAME = COMMAND_NAME;

export const ServerCommand: ISlashCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Update your PokeSandbox server settings')
    .setContexts(InteractionContextType.Guild),
  createMenu: (session) =>
    new AdminMenuBuilder(session, COMMAND_NAME)
      .setButtons(getServerButtons)
      .setEmbeds(getServerMenuEmbeds)
      .setCancellable()
      .setTrackedInHistory()
      .build(),
};

const getServerButtons = async (): Promise<
  ButtonInputConfig<AdminMenuContext>[]
> => {
  const subMenuButtons: { id: string; command: string; option?: string }[] = [
    { id: 'Prefix', command: SERVER_MANAGE_PREFIXES_COMMAND_NAME },
    {
      id: 'Admin',
      command: SERVER_MANAGE_ROLES_COMMAND_NAME,
      option: 'admin',
    },
    {
      id: 'Mod',
      command: SERVER_MANAGE_ROLES_COMMAND_NAME,
      option: 'mod',
    },
    { id: 'Discovery', command: DISCOVERY_COMMAND_NAME },
  ];

  return subMenuButtons.map(({ id, command, option }, idx) => ({
    label: (idx + 1).toString(),
    id,
    style: ButtonStyle.Primary,
    action: async (ctx: AdminMenuContext) =>
      ctx.goTo(command, { role_type: option }),
  }));
};
