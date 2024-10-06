import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';

import { AdminMenu, Session } from '@bot/classes';
import type { Server } from '@shared/models';
import { findServer } from '@shared/services';
import type { ISlashCommand } from '@bot/structures/interfaces';

import setServerMenuComponents from './components/setServerMenuComponents';
import getServerMenuEmbed from './embeds/getServerMenuEmbed';
import handleUpdatePrefixes from './optionHandlers/handleUpdatePrefixes';
import handleUpdateRoles from './optionHandlers/handleUpdateRoles';

export const ServerCommand: ISlashCommand = {
  name: 'server',
  anyUserPermissions: ['Administrator'],
  onlyRoles: async (guildId: string): Promise<string[]> => {
    const server: Server | null = await findServer({ serverId: guildId });
    if (!server?.adminRoleIds) return [];
    return server.adminRoleIds;
  },
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName('server')
    .setDescription('Update your PokeSandbox server settings')
    .setDMPermission(false),
  // createMenu: async () => {
  //   return await AdminMenu.create();
  // },
  execute: async (session: Session) => {
    const menu = await AdminMenu.create(
      session.client,
      session.commandInteraction
    );

    await menu.populateAdminRoles();
    await menu.populateModRoles();

    while (!menu.isCancelled) {
      menu.isRootMenu = true;
      setServerMenuComponents(menu);
      menu.embeds = [getServerMenuEmbed(menu)];

      await menu.sendEmbedMessage();

      const selection = await menu.awaitButtonMenuInteraction(120_000);
      if (selection === undefined) continue;

      switch (selection) {
        case 'Prefix':
          await handleUpdatePrefixes(menu);
          break;
        case 'Admin':
        case 'Mod':
          await handleUpdateRoles(menu, selection);
          break;
        case 'Discovery':
          await session.executeCommand('discovery');
          break;
        default:
          await menu.handleError(new Error('Invalid option selected'));
      }
    }
  },
};
