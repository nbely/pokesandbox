import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';

import { AdminMenu, Session } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import type { Server } from '@shared/models';
import { findServer } from '@shared/services';

import setRegionsMenuComponents from './components/setRegionsMenuComponents';
import getRegionsMenuEmbed from './embeds/getRegionsMenuEmbed';
import handleCreateRegion from './optionHandlers/handleCreateRegion';
import handleManageRegionMenu from './submenus/manageRegionMenu/manageRegionMenu';

export const RegionsCommand: ISlashCommand = {
  name: 'regions',
  anyUserPermissions: ['Administrator'],
  onlyRoles: async (guildId: string): Promise<string[]> => {
    const server: Server | null = await findServer({ serverId: guildId });
    if (!server?.adminRoleIds) return [];
    return server.adminRoleIds;
  },
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName('regions')
    .setDescription('Manage Regions for your PokéSandbox server')
    .setDMPermission(false),
  execute: async (session: Session) => {
    const menu = await AdminMenu.create(
      session.client,
      session.commandInteraction
    );
    if (menu.initialized === false) return;

    if (menu.server.regions.length === 0) {
      await handleCreateRegion(menu);
    } else {
      await menu.populateRegions();
    }

    while (!menu.isCancelled) {
      menu.isRootMenu = true;
      menu.prompt = menu.prompt || 'Please select a Region to manage.';
      setRegionsMenuComponents(menu);
      menu.embeds = [getRegionsMenuEmbed(menu)];

      await menu.sendEmbedMessage();

      const selection = await menu.awaitButtonMenuInteraction(120_000);
      if (selection === undefined) continue;

      switch (selection) {
        case 'Create Region':
          await handleCreateRegion(menu);
          break;
        default:
          if (Number.isNaN(+selection)) {
            menu.handleError(new Error('Invalid Option Selected'));
          } else {
            menu.region = menu.regions[+selection];
            await handleManageRegionMenu(menu);
          }
          break;
      }
    }
  },
};
