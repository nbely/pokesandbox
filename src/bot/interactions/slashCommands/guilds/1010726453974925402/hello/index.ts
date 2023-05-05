import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  Client,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";

import HelloMenu1 from "@interactions/stringSelectMenus/hello/menu1";
import ISlashCommand from "@structures/interfaces/slashCommand";

const Hello: ISlashCommand = {
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
    await interaction.deferReply({ephemeral: true});
    
    const namePreference = interaction.options.get('name')?.value;
    let name = interaction.user.username;
    if (namePreference === "tag") {
      name = interaction.user.tag;
    }
    const content = `${interaction.options.get('greeting')?.value}, ${name}!
      \nHow would you like to respond?`;
    
    const components = [
      new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(HelloMenu1.component)
    ];

    await interaction.followUp({
        content,
        components,
    });
  },
};

export default Hello;
