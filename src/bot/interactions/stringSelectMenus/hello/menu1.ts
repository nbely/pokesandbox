import {
  Client,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
} from "discord.js";

import IStringSelectMenu from "@structures/interfaces/stringSelectMenu";

const HelloMenu1: IStringSelectMenu = {
  component: new StringSelectMenuBuilder()
    .setCustomId("hello_menu1")
    .setPlaceholder("Make a selection!")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Nice weather we're having!")
        .setDescription("Send a response about the nice weather.")
        .setValue("nice_weather"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Have a nice day!")
        .setDescription("Send aresponse wishing a nice day.")
        .setValue("nice_day"),
    ),
  customId: "hello_menu1",
  execute: async (client: Client, interaction: StringSelectMenuInteraction ) => { 
    await interaction.deferReply({ephemeral: true});
    
    const content = `Likewise: ${interaction.values[0]}`;

    await interaction.followUp({
        content
    });
  },
};

export default HelloMenu1;
