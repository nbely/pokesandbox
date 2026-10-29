import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { saveServer } from '@bot/cache';
import { AdminMenuBuilder, type AdminMenuContext } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';
import type { ButtonInputConfig } from '@flowcord/core';

import { getServerMenuEmbeds } from './server.embeds';
import { SERVER_ADD_ROLE_COMMAND_NAME } from './serverAddRole';
import type { ServerManageRolesCommandOptions } from './types';

const COMMAND_NAME = 'server-manage-roles';
export const SERVER_MANAGE_ROLES_COMMAND_NAME = COMMAND_NAME;

export const ServerManageRolesCommand: ISlashCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Manage command prefixes for your server')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('role_type')
        .setDescription('The type of role to manage')
        .setRequired(true)
        .addChoices(
          { name: 'Admin', value: 'admin' },
          { name: 'Mod', value: 'mod' }
        )
    ),
  createMenu: (session, options) => {
    const { role_type } = options as unknown as ServerManageRolesCommandOptions;
    if (!role_type) {
      throw new Error('Role type is required to manage server roles.');
    }

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setButtons((ctx) => getServerManageRolesButtons(ctx, role_type), {})
      .setEmbeds((ctx) =>
        getServerMenuEmbeds(
          ctx,
          `Add or Remove a Role with Bot ${role_type} privileges.`
        )
      )
      .setCancellable()
      .setTrackedInHistory()
      .setReturnable()
      .build();
  },
};

export const getServerManageRolesButtons = async (
  ctx: AdminMenuContext,
  roleType: string
): Promise<ButtonInputConfig<AdminMenuContext>[]> => {
  const roles = await ctx.admin.getRoles(roleType as 'admin' | 'mod');

  return [
    {
      label: 'Add Role',
      style: ButtonStyle.Success,
      fixedPosition: 'start',
      action: async (ctx: AdminMenuContext) =>
        ctx.goTo(SERVER_ADD_ROLE_COMMAND_NAME, {
          role_type: roleType,
        }),
    },
    ...roles.map((role, idx) => ({
      label: `Remove [${typeof role === 'string' ? role : role.name}]`,
      style: ButtonStyle.Danger,
      action: async (ctx: AdminMenuContext) => {
        const server = await ctx.admin.getServer();

        if (roleType === 'admin') {
          server.adminRoleIds.splice(idx, 1);
        } else if (roleType === 'mod') {
          server.modRoleIds.splice(idx, 1);
        }

        await saveServer(server);
      },
      id: idx.toString(),
    })),
  ];
};
