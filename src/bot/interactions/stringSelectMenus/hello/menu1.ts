import { Client, StringSelectMenuInteraction } from "discord.js";

import { StringSelectMenu } from "../../../stringSelectMenus";
import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "@discordjs/builders";

const HelloMenu1: StringSelectMenu = {
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
