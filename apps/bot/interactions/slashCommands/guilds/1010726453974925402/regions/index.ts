import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { AdminMenu } from "@bot/classes/adminMenu";
import { BotClient } from "@bot/index";
import { findServer } from "@services/server.service";
import getRegionsMenuEmbed from "./embeds/getRegionsMenuEmbed";
import handleCreateRegion from "./optionHandlers/handleCreateRegion";
import handleManageRegionMenu from "./submenus/manageRegionMenu/manageRegionMenu";
import setRegionsMenuComponents from "./components/setRegionsMenuComponents";
import type { IServer } from "@models/server.model";
import type ISlashCommand from "@structures/interfaces/slashCommand";

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

    if (menu.server.regions.length === 0) {
      await handleCreateRegion(menu);
    } else {
      await menu.populateRegions();
    }

    while (!menu.isCancelled) {
      menu.isRootMenu = true;
      menu.prompt = menu.prompt || "Please select a Region to manage.";
      setRegionsMenuComponents(menu);
      menu.embeds = [getRegionsMenuEmbed(menu)];

      await menu.sendEmbedMessage();

      const selection = await menu.awaitButtonMenuInteraction(120_000);
      if (selection === undefined) continue;
      
      switch (selection) {
        case "Create Region":
          await handleCreateRegion(menu);
          break;
        default:
          if (Number.isNaN(+selection)) {
            menu.handleError(new Error("Invalid Option Selected"));                
          } else {
            menu.region = menu.regions[+selection];
            await handleManageRegionMenu(menu);
          }
          break;
      }
    }
  },
};

export default Regions;
