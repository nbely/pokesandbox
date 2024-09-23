import { EmbedBuilder } from "discord.js";

import { AdminMenu } from "@bot/classes/adminMenu";

const getRegionsMenuEmbed = (menu: AdminMenu): EmbedBuilder => {
  return new EmbedBuilder()
    .setColor("Gold")
    .setAuthor({
      name: `${menu.server.name} Region Manager:`,
      iconURL: menu.commandInteraction.guild?.iconURL() || undefined,
    })
    .setDescription(
      `${menu.prompt ? "**" + menu.prompt + "**\n\n" : ""}` +
        menu.regions.map((region) => `${region.name}: Inactive`).join("\n"),
    )
    .setTimestamp();
};

export default getRegionsMenuEmbed;
