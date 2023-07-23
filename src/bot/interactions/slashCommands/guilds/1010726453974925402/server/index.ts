import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { AdminMenu } from "@bot/classes/adminMenu";
import { BotClient } from "@bot/index";
import createServerMenu from "./components/getServerMenuComponents";
import { findServer } from "@services/server.service";
import getInitializedEmbed from "./embeds/getServerInitializedEmbed";
import getServerOptionsEmbed from "./embeds/getServerMenuEmbed";
import handleDiscoveryOptions from "./optionHandlers/handleDiscoveryOptions";
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
      await interaction.followUp({ embeds: [getInitializedEmbed(menu)] });
    }

    await menu.populateAdminRoles();
    await menu.populateModRoles();

    while (!menu.isCancelled) {
      menu.components = createServerMenu();
      menu.embeds = [getServerOptionsEmbed(menu)];

      await menu.sendEmbedMessage();

      try {
        // TODO: Change timeout later
        let option = await menu.awaitButtonMenuInteraction(60_000);

        option = "test";
        switch (option) {
          case "Cancel":
            await menu.cancelMenu();
            break;
          case "Prefix":
            await handleUpdatePrefixes(menu);
            break;
          case "Admin":
          case "Mod":
            await handleUpdateRoles(menu, option);
            break;
          case "Discovery":
            await handleDiscoveryOptions(menu);
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
