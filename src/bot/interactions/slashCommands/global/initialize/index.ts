import {
  ChatInputCommandInteraction,
  Client,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

import { SlashCommand } from "@structures/managers/slashCommands";
import { findServer } from "@services/server.service";

const Initialize: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("initialize")
    .setDescription("Initializes your PokeSandBox server")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),
  execute: async (client: Client, interaction: ChatInputCommandInteraction) => {    
    await interaction.deferReply({ephemeral: true});
    const server = await findServer({ serverId: interaction?.guild?.id});
    const content = server 
      ? "Your server has already been intialized!"
      : "Your server will be initialized!";

    await interaction.followUp({
        ephemeral: true,
        content
    });
  },
};

export default Initialize;
