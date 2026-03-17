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

import { getServerMenuEmbeds } from './server.embeds';
import { SERVER_ADD_PREFIX_COMMAND_NAME } from './serverAddPrefix';

const COMMAND_NAME = 'server-manage-prefixes';
export const SERVER_MANAGE_PREFIXES_COMMAND_NAME = COMMAND_NAME;

export const ServerManagePrefixesCommand: ISlashCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Manage command prefixes for your server')
    .setContexts(InteractionContextType.Guild),
  createMenu: (session) =>
    new AdminMenuBuilder(session, COMMAND_NAME)
      .setButtons(getServerManagePrefixesButtons)
      .setEmbeds((ctx) => getServerMenuEmbeds(ctx, 'Add or remove a prefix.'))
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build(),
};

export const getServerManagePrefixesButtons = async (
  ctx: AdminMenuContext
): Promise<ButtonInputConfig<AdminMenuContext>[]> => {
  const server = await ctx.admin.getServer();

  return [
    {
      label: 'Add Prefix',
      style: ButtonStyle.Success,
      fixedPosition: 'start',
      action: async (ctx: AdminMenuContext) =>
        ctx.goTo(SERVER_ADD_PREFIX_COMMAND_NAME),
    },
    ...server.prefixes.map((prefix, idx) => ({
      label: `Remove ${prefix}`,
      style: ButtonStyle.Danger,
      action: async (ctx: AdminMenuContext) => {
        const server = await ctx.admin.getServer();

        const removedPrefix = server.prefixes?.splice(idx, 1)[0];
        await saveServer(server);
        ctx.state.set(
          'prompt',
          `Successfully removed the prefix: \`${removedPrefix}\``
        );
      },
      id: idx.toString(),
    })),
  ];
};
