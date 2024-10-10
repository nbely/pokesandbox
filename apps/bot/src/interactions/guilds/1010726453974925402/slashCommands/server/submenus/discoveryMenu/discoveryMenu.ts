import { SlashCommandBuilder } from 'discord.js';

import { AdminMenuBuilder, Session } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { Server } from '@shared/models';
import { findServer, upsertServer } from '@shared/services';

import setDiscoveryMenuComponents from './components/setDiscoveryMenuComponents';
import getDiscoveryMenuEmbed from './embeds/getDiscoveryMenuEmbed';
import handleSetDescription from './optionHandlers/handleSetDescription';

export const DiscoveryCommand: ISlashCommand = {
  name: 'discovery',
  anyUserPermissions: ['Administrator'],
  onlyRoles: async (guildId: string): Promise<string[]> => {
    const server: Server | null = await findServer({ serverId: guildId });
    if (!server?.adminRoleIds) return [];
    return server.adminRoleIds;
  },
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName('discovery')
    .setDescription('Update your server discovery settings')
    .setDMPermission(false),
  execute: async (session: Session) => {
    const menu = await AdminMenuBuilder.create(
      session.client,
      session.commandInteraction
    );
    session.addMenu(menu);

    await handleDiscoveryMenu(menu);
  },
};

async function handleDiscoveryMenu(menu: AdminMenuBuilder): Promise<void> {
  menu.isBackSelected = false;
  console.log('handleDiscoveryMenu');

  while (!menu.isBackSelected && !menu.isCancelled) {
    console.log('while loop');
    menu.prompt =
      menu.prompt ||
      'Select an option to update your Server Discovery settings.';
    menu.isBackSelected = false;
    setDiscoveryMenuComponents(menu);
    console.log('setDiscoveryMenuComponents');
    if (!menu.server.discovery.enabled && !menu.server.discovery.description) {
      menu.components[0].components[0].setDisabled(true);
    }
    menu.embeds = [await getDiscoveryMenuEmbed(menu)];
    console.log('getDiscoveryMenuEmbed');

    await menu.sendEmbedMessage();
    console.log('updateEmbedMessage');

    const selection = await menu.awaitButtonMenuInteraction(120_000);
    if (selection === undefined) continue;

    switch (selection) {
      case 'Enable':
      case 'Disable':
        menu.prompt = `Successfully ${
          selection === 'Enable' ? 'enabled' : 'disabled'
        } Server Discovery`;
        menu.server.discovery.enabled = !menu.server.discovery.enabled;
        await upsertServer({ serverId: menu.server.serverId }, menu.server);
        break;
      case 'Set Description':
        await handleSetDescription(menu);
        break;
      default:
        menu.handleError(new Error('Invalid option selected'));
    }
  }
}

export default handleDiscoveryMenu;
