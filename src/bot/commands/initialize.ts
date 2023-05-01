import {
  ChatInputCommandInteraction,
  Client,
  PermissionFlagsBits,
} from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

import { SlashCommand } from "../commands";

const Initialize: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("initialize")
    .setDescription("Initializes your PokeSandBox server")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),
  execute: async (client: Client, interaction: ChatInputCommandInteraction) => {   
    const content = 'Your server will be initialized!';

    await interaction.followUp({
        ephemeral: true,
        content
    });
  },
};

export default Initialize;
