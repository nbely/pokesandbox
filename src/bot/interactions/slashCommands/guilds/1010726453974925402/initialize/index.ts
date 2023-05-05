import {
  ChatInputCommandInteraction,
  Client,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

import { findServer } from "@services/server.service";
import { IServer } from "@models/server.model";
import ISlashCommand from "@structures/interfaces/slashCommand";

const Initialize: ISlashCommand = {
  command: new SlashCommandBuilder()
    .setName("initialize")
    .setDescription("Initializes your PokeSandBox server")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),
  execute: async (client: Client, interaction: ChatInputCommandInteraction) => {    
    await interaction.deferReply({ephemeral: true});
    const server: IServer | null = await findServer({ serverId: interaction.guild?.id});
    const content: string = server 
      ? "Your server has already been intialized!"
      : "Your server will be initialized!";

    await interaction.followUp({
        ephemeral: true,
        content
    });
  },
};

export default Initialize;
