import {
  ActionRowBuilder,
  ButtonBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  Message,
  MessageComponentInteraction,
  Role,
  SlashCommandBuilder,
} from "discord.js";

import { BotClient } from "@bot/index";
import buildErrorEmbed from "@embeds/errorEmbed";
import createNewServer from "./utils/createNewServer";
import createServerMenu from "./utils/createServerMenu";
import { findServer } from "@services/server.service";
import getInitializedEmbed from "./embeds/initializedEmbed";
import getServerOptionsEmbed from "./embeds/serverOptionsEmbed";
import handleDiscoveryOptions from "./optionHandlers/handleDiscoveryOptions";
import handleMenuUpdate from "./utils/handleMenuUpdate";
import handleUpdatePrefixes from "./optionHandlers/handleUpdatePrefixes";
import handleUpdateRoles from "./optionHandlers/handleUpdateRoles";

import { IServer } from "@models/server.model";
import { IServerMenu } from "./interfaces/menu";
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
  execute: async (client: BotClient, interaction: ChatInputCommandInteraction) => {    
    await interaction.deferReply();
    if (!interaction.guild) return;
    
    let server: IServer | null = await findServer({ serverId: interaction.guild?.id});
    if (!server) {
      server = await createNewServer(interaction);
      await interaction.followUp({
        embeds: [getInitializedEmbed(server, interaction)],
      });
    }
    if (!server) return;

    const adminRoles: (string | Role)[] | undefined = server.adminRoleIds
      ? await Promise.all(server.adminRoleIds.map(async (roleId) => 
        interaction.guild?.roles.cache.get(roleId)
          || await interaction.guild?.roles.fetch(roleId)
          || roleId
      ))
      : undefined;
    const modRoles: (string | Role)[] | undefined = server.modRoleIds
      ? await Promise.all(server.modRoleIds.map(async (roleId) => 
        interaction.guild?.roles.cache.get(roleId)
          || await interaction.guild?.roles.fetch(roleId)
          || roleId
      ))
      : undefined;

    let menu: IServerMenu = { adminRoles, modRoles, prompt: "", server };
    const components: ActionRowBuilder<ButtonBuilder>[] = createServerMenu();
    
    while (!menu.isCancelled) {
      const embeds: EmbedBuilder[] = [await getServerOptionsEmbed(
        interaction,
        menu,
      )];
      if (!menu.message) {
        menu.message = await interaction.followUp({ components, embeds });
      } else if (menu.interaction) {
        menu = await handleMenuUpdate(menu, { components, embeds });
      }

      const filter = (componentInteraction: MessageComponentInteraction): boolean => {
        return componentInteraction.user === interaction.user;
      };
      try {
        // TODO: Change timeout later 
        menu.interaction = await menu.message!.awaitMessageComponent({ filter,  time: 60_000 });
        const option: string = menu.interaction.customId.split("_")[1];
    
        switch (option) {
          case "Cancel":
            menu.interaction.update({content: "*Command Cancelled*", components: [], embeds: []})
            menu.isCancelled = true;
            break;
          case "Prefix":
            menu = await handleUpdatePrefixes(client, menu) || menu;
            break;
          case "Admin":
          case "Mod":
            menu = await handleUpdateRoles(client, menu, option) || menu;
            break;
          case "Discovery":
            menu = await handleDiscoveryOptions(client, menu) || menu;
            break;
          default:
            menu.interaction.update({embeds: [
              buildErrorEmbed(
                client,
                (interaction.member as GuildMember),
                "An unknown error occured while processing your selection.",
                true
              ),
            ], components: []});
            return;
        }
      }
      catch(e) {
        console.error(e);
        (menu.message as Message).edit({embeds: [
          buildErrorEmbed(
            client,
            interaction.member as GuildMember,
            "Sorry, the Server Options menu has timed out. Please try again.",
          ),
        ], components: []});
        menu.isCancelled = true;
        return;
      }
    }
  },
};

export default Server;
