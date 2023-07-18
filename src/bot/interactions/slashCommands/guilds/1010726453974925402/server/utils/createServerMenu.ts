import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

import ServerOption from "@bot/interactions/buttons/server/option";

const createServerMenu = (): ActionRowBuilder<ButtonBuilder>[] => {
  return [
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        ServerOption.create({
          label: "1",
          style: ButtonStyle.Primary,
          id: "Prefix",
        }),
      )
      .addComponents(
        ServerOption.create({
          label: "2",
          style: ButtonStyle.Primary,
          id: "Admin",
        }),
      )
      .addComponents(
        ServerOption.create({
          label: "3",
          style: ButtonStyle.Primary,
          id: "Mod",
        }),
      )
      .addComponents(
        ServerOption.create({
          label: "4",
          style: ButtonStyle.Primary,
          id: "Discovery",
        }),
      )
      .addComponents(
        ServerOption.create({ label: "Cancel", style: ButtonStyle.Secondary }),
      ),
  ];
};

export default createServerMenu;
