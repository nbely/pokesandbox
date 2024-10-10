import {
  ButtonStyle,
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';

import { AdminMenuBuilder, MenuBuilder, Session } from '@bot/classes';
import type { Server } from '@shared/models';
import { findServer } from '@shared/services';
import type { ISlashCommand } from '@bot/structures/interfaces';

import setServerMenuComponents from './components/setServerMenuComponents';
import getServerMenuEmbed from './embeds/getServerMenuEmbed';
import handleUpdatePrefixes from './optionHandlers/handleUpdatePrefixes';
import handleUpdateRoles from './optionHandlers/handleUpdateRoles';
import { MenuButtonConfig } from 'apps/bot/src/classes/Menu';

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
  createMenu: async (session: Session): Promise<AdminMenuBuilder> =>
    (
      await AdminMenuBuilder.create(
        session.client,
        session.commandInteraction,
        {
          useAdminRoles: true,
          useModRoles: true,
        }
      )
    ).setButtons(getButtonConfigs),

  // .setEmbeds((menu: AdminMenu) => [getServerMenuEmbed(menu)]);

  // setServerMenuComponents(menu);    menu.embeds = [getServerMenuEmbed(menu)];

  // while (!menu.isCancelled) {
  //   menu.isRootMenu = true;
  //   setServerMenuComponents(menu);
  //   menu.embeds = [getServerMenuEmbed(menu)];

  //   await menu.sendEmbedMessage();

  //   const selection = await menu.awaitButtonMenuInteraction(120_000);
  //   if (selection === undefined) continue;

  //   switch (selection) {
  //     case 'Prefix':
  //       await handleUpdatePrefixes(menu);
  //       break;
  //     case 'Admin':
  //     case 'Mod':
  //       await handleUpdateRoles(menu, selection);
  //       break;
  //     case 'Discovery':
  //       await session.executeCommand('discovery');
  //       break;
  //     default:
  //       await menu.handleError(new Error('Invalid option selected'));
  //   }
  // }
};

function getButtonConfigs(menu: AdminMenuBuilder): MenuButtonConfig[] {
  return [
    { label: '1', style: ButtonStyle.Primary, onClick: () => {} },
    { label: '2', style: ButtonStyle.Primary, onClick: () => {} },
    { label: '3', style: ButtonStyle.Primary, onClick: () => {} },
    { label: '4', style: ButtonStyle.Primary, onClick: () => {} },
  ];
  // menu.paginationOptions = {
  //   buttons: [
  //     menu.createButton('1', ButtonStyle.Primary, 'Prefix'),
  //     menu.createButton('2', ButtonStyle.Primary, 'Admin'),
  //     menu.createButton('3', ButtonStyle.Primary, 'Mod'),
  //     menu.createButton('4', ButtonStyle.Primary, 'Discovery'),
  //   ],
  //   fixedEndButtons: [],
  //   fixedStartButtons: [],
  // };
}
