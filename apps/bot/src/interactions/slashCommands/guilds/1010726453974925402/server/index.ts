import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';

import { AdminMenu, type BotClient } from '@bot/classes';
import type { Server } from '@shared/models';
import { findServer } from '@shared/services';
import type { ISlashCommand } from '@bot/structures/interfaces';

import setServerMenuComponents from './components/setServerMenuComponents';
import getServerInitializedEmbed from './embeds/getServerInitializedEmbed';
import getServerMenuEmbed from './embeds/getServerMenuEmbed';
import handleUpdatePrefixes from './optionHandlers/handleUpdatePrefixes';
import handleUpdateRoles from './optionHandlers/handleUpdateRoles';
import handleDiscoveryMenu from './submenus/discoveryMenu/discoveryMenu';

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
  execute: async (
    client: BotClient,
    interaction: ChatInputCommandInteraction
  ) => {
    await interaction.deferReply();
    if (!interaction.guild) return;

    const menu = new AdminMenu(client, interaction);
    if ((await menu.initialize()) === false) {
      await interaction.followUp({ embeds: [getServerInitializedEmbed(menu)] });
    }

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
          await handleDiscoveryMenu(menu);
          break;
        default:
          await menu.handleError(new Error('Invalid option selected'));
      }
    }
  },
};
