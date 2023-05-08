import { ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder } from "discord.js";

import { BotClient } from "@bot/index";
import IButtonCommand from "@structures/interfaces/buttonCommand";
import Server from "@interactions/slashCommands/guilds/1010726453974925402/server";

const ServerOption: IButtonCommand = {
  name: "server-option",
  create: (options: { label: string, style: ButtonStyle }) => {
    return new ButtonBuilder()
      .setCustomId(`server-option_${options.label}`)
      .setLabel(options.label)
      .setStyle(options.style)
  },
  execute: async (client: BotClient, interaction: ButtonInteraction ) => {
    const option = interaction.customId.split("_")[1];
    const originalMessage = interaction.message;

    if (option === "Cancel") {
      originalMessage.edit({content: '*Command Cancelled*', components: [], embeds: []})
      return;
    };

    const optionEmbed = new EmbedBuilder()
      .setColor("Gold")
      .setTimestamp()
      .setAuthor({
        name: `Option ${option}`,
        iconURL: interaction.guild?.iconURL() || undefined
      })
      .setDescription(`Do a thing`);

    originalMessage.edit({embeds: [optionEmbed], components: []});

    Server.execute(client, interaction);
  },
}

export default ServerOption;
