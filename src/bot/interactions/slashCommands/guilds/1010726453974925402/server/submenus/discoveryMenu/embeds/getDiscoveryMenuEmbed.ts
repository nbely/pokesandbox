import { EmbedBuilder } from "discord.js";

import { AdminMenu } from "@bot/classes/adminMenu";

const getDiscoveryMenuEmbed = async (menu: AdminMenu) => {
  return new EmbedBuilder()
    .setColor("Gold")
    .setAuthor({
      name: `${menu.server.name} Discovery Settings:`,
      iconURL: menu.componentInteraction?.guild?.iconURL() ?? undefined,
    })
    .setDescription(`${menu.prompt ? "" + menu.prompt + "\n\n" : ""}`)
    .addFields(
      {
        name: "Status:",
        value: menu.server.discovery.enabled ? "Enabled" : "Disabled",
      },
      {
        name: "Server Description:",
        value: menu.server.discovery.description || "None",
      },
    )
    .setTimestamp();
};

export default getDiscoveryMenuEmbed;
