import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { AdminMenu } from "@bot/classes/adminMenu";
import { BotClient } from "@bot/index";
import { findServer } from "@services/server.service";
import getServerInitializedEmbed from "./embeds/getServerInitializedEmbed";
import getServerMenuComponents from "./components/getServerMenuComponents";
import getServerMenuEmbed from "./embeds/getServerMenuEmbed";
import handleDiscoveryMenu from "./submenus/discoveryMenu/discoveryMenu";
import handleUpdatePrefixes from "./optionHandlers/handleUpdatePrefixes";
import handleUpdateRoles from "./optionHandlers/handleUpdateRoles";

import { IServer } from "@models/server.model";
import ISlashCommand from "@structures/interfaces/slashCommand";

const Server: ISlashCommand = {
  name: "server",
  anyUserPermissions: ["Administrator"],
  onlyRoles: async (guildId: string): Promise<string[]> => {
    const server: IServer | null = await findServer({ serverId: guildId });
    if (!server?.adminRoleIds) return [];
    return server.adminRoleIds;
  },
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName("server")
    .setDescription("Update your PokeSandbox server settings")
    .setDMPermission(false),
  execute: async (
    client: BotClient,
    interaction: ChatInputCommandInteraction,
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
      menu.components = getServerMenuComponents();
      menu.embeds = [getServerMenuEmbed(menu)];

      await menu.sendEmbedMessage();

      try {
        const option = await menu.awaitButtonMenuInteraction(120_000);

        switch (option) {
          case "Cancel":
            await menu.cancel();
            break;
          case "Prefix":
            await handleUpdatePrefixes(menu);
            break;
          case "Admin":
          case "Mod":
            await handleUpdateRoles(menu, option);
            break;
          case "Discovery":
            await handleDiscoveryMenu(menu);
            break;
          default:
            await menu.handleError();
        }
      } catch (error) {
        await menu.handleError(error);
      }
    }
  },
};

export default Server;
