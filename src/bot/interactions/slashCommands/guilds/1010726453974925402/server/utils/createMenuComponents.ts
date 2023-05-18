import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

import ServerOption from "@bot/interactions/buttons/server/option";

const createMenuComponents = (): ActionRowBuilder<ButtonBuilder>[] => {
  return [
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(ServerOption.create({label: "1", style: ButtonStyle.Primary, id: "Prefix"}))
      .addComponents(ServerOption.create({label: "2", style: ButtonStyle.Primary}))
      .addComponents(ServerOption.create({label: "3", style: ButtonStyle.Primary}))
      .addComponents(ServerOption.create({label: "Cancel", style: ButtonStyle.Secondary}))
  ];
}

export default createMenuComponents;
