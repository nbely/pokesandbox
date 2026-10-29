import {
  InteractionContextType,
  RoleSelectMenuBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import { saveServer } from '@bot/cache';
import { AdminMenuBuilder, type AdminMenuContext } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';
import type { SelectInputConfig } from '@flowcord/core';

import { getServerMenuEmbeds } from './server.embeds';
import { SERVER_MANAGE_ROLES_COMMAND_NAME } from './serverManageRoles';

const COMMAND_NAME = 'server-add-role';
export const SERVER_ADD_ROLE_COMMAND_NAME = COMMAND_NAME;

type ServerAddRoleCommandOptions = {
  role_type: string;
};

export const ServerAddRoleCommand: ISlashCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Add a new admin or mod role to your server')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('role_type')
        .setDescription('The type of role to add')
        .setRequired(true)
        .addChoices(
          { name: 'Admin', value: 'admin' },
          { name: 'Mod', value: 'mod' }
        )
    ),
  createMenu: (session, options) => {
    const { role_type } = options as unknown as ServerAddRoleCommandOptions;
    if (!role_type) {
      throw new Error('Role type is required to add a server role.');
    }

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setEmbeds((ctx) =>
        getServerMenuEmbeds(
          ctx,
          `Please select a role to grant Bot ${role_type} privileges to.`
        )
      )
      .setSelectMenu((ctx) => getServerAddRoleSelectMenu(ctx, role_type))
      .setFallbackMenu(SERVER_MANAGE_ROLES_COMMAND_NAME, {
        role_type,
      })
      .build();
  },
};

export const getServerAddRoleSelectMenu = async (
  _ctx: AdminMenuContext,
  roleType: string
): Promise<SelectInputConfig<AdminMenuContext>> => {
  return {
    builder: new RoleSelectMenuBuilder()
      .setCustomId(`server-add-${roleType}-role`)
      .setPlaceholder('Select a role to add'),
    onSelect: async (ctx: AdminMenuContext, selectedRoleIds: string[]) => {
      const server = await ctx.admin.getServer();
      const roleIds =
        roleType === 'admin' ? server.adminRoleIds : server.modRoleIds;
      const newRoleIds = selectedRoleIds.filter(
        (roleId) => !roleIds.includes(roleId)
      );

      if (newRoleIds.length > 0) {
        const newRoles = await Promise.all(
          newRoleIds.map((roleId) => ctx.admin.getGuildRole(roleId))
        );

        if (roleType === 'admin') {
          server.adminRoleIds = roleIds.concat(newRoleIds);
        } else if (roleType === 'mod') {
          server.modRoleIds = roleIds.concat(newRoleIds);
        }

        await saveServer(server);
        ctx.state.set(
          'prompt',
          `Successfully added the ${roleType} roles: ${newRoles.join(', ')}`
        );
      } else {
        ctx.state.set('prompt', `No new ${roleType} roles were selected.`);
      }
      await ctx.goBack();
    },
  };
};
