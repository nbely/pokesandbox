import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { AdminMenu } from "@bot/classes/adminMenu";
import { BotClient } from "@bot/index";
import { findServer } from "@services/server.service";
import getRegionsMenuComponents from "./components/getRegionsMenuComponents";
import getRegionsMenuEmbed from "./embeds/getRegionsMenuEmbed";
import handleCreateRegion from "./optionHandlers/handleCreateRegion";

import { IServer } from "@models/server.model";
import ISlashCommand from "@structures/interfaces/slashCommand";

const Regions: ISlashCommand = {
  name: "regions",
  anyUserPermissions: ["Administrator"],
  onlyRoles: async (guildId: string): Promise<string[]> => {
    const server: IServer | null = await findServer({ serverId: guildId });
    if (!server?.adminRoleIds) return [];
    return server.adminRoleIds;
  },
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName("regions")
    .setDescription("Manage Regions for your PokéSandbox server")
    .setDMPermission(false),
  execute: async (
    client: BotClient,
    interaction: ChatInputCommandInteraction,
  ) => {
    await interaction.deferReply();

    const menu = new AdminMenu(client, interaction);
    if ((await menu.initialize()) === false) return;
    menu.prompt = "Please select a Region to manage.";

    if (menu.server.regions.length === 0) {
      await handleCreateRegion(menu);
    } else {
      await menu.populateRegions();
    }

    while (!menu.isCancelled) {
      menu.components = getRegionsMenuComponents(menu);
      menu.embeds = [getRegionsMenuEmbed(menu)];

      await menu.sendEmbedMessage();

      try {
        // TODO: Change timeout later
        const option = await menu.awaitButtonMenuInteraction(60_000);

        switch (option) {
          case "Cancel":
            await menu.cancelMenu();
            break;
          case "Create Region":
            await handleCreateRegion(menu);
            menu.prompt = `Successfully created a new Region: \`${
              menu.regions[+option]
            }\``;
            break;
          default:
            if (!option || Number.isNaN(+option))
              throw new Error("Invalid Option Selected");

            menu.region = menu.regions[+option];
            // await handleRegionOptions(menu)
            break;
        }
      } catch (error) {
        await menu.handleError(error);
      }
    }
  },
};

export default Regions;
