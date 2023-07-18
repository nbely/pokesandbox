import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageComponentInteraction
} from "discord.js";

import { IServerMenu } from "../interfaces/menu";

const getDiscoveryOptionsEmbed = async (
  interaction: ChatInputCommandInteraction | MessageComponentInteraction,
  menu: IServerMenu,
) => {
  return new EmbedBuilder()
    .setColor("Gold")
    .setTimestamp()
    .setAuthor({
      name: `${menu.server.name} Discovery Settings:`,
      iconURL: interaction.guild?.iconURL() || undefined
    })
    .setDescription(`${menu.prompt ? ("" + menu.prompt + "\n\n") : ""}`)
    .addFields(
      { name: "Status:", value: menu.server.discovery.enabled ? "Enabled" : "Disabled"},
      { name: "Server Description:", value: menu.server.discovery.description || "None" },
    );
};

export default getDiscoveryOptionsEmbed;
