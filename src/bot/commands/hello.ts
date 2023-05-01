import {
  ChatInputCommandInteraction,
  Client,
} from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

import { SlashCommand } from "../commands";

const Hello: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("hello")
    .setDescription("Returns a greeting")
    .addStringOption((option) => 
      option
        .setName("greeting")
        .setDescription("Specify a greeting type")
        .setRequired(true)
        .setChoices(
          {
            name: 'Greetings',
            value: 'Greetings',
          },
          {
            name: 'Salutations',
            value: 'Salutations',
          },
        )
    )
    .addStringOption((option) => 
      option
        .setName("name")
        .setDescription("Specify what you'd like to be called by")
        .setRequired(true)
        .setChoices(
          {
            name: 'Username',
            value: 'username',
          },
          {
            name: 'Tag',
            value: 'tag',
          },
        )
    ),
  execute: async (client: Client, interaction: ChatInputCommandInteraction) => {   
    const namePreference = interaction.options.get('name')?.value;
    let name = interaction.user.username;
    if (namePreference === "tag") {
      name = interaction.user.tag;
    }
    const content = `${interaction.options.get('greeting')?.value}, ${name}!`;

    await interaction.followUp({
        ephemeral: true,
        content
    });
  },
};

export default Hello;
