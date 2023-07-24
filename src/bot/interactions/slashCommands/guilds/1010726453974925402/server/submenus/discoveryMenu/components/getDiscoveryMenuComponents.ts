import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

import ServerOption from "@bot/interactions/buttons/server/option";

/**
 * Creates the action row buttons for the discovery menu
 * @returns {ActionRowBuilder<ButtonBuilder>[]} - The action row buttons for the discovery menu
 */
const getDiscoveryMenuComponents = (
  enabled?: boolean,
): ActionRowBuilder<ButtonBuilder>[] => {
  return [
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        ServerOption.create({
          label: enabled ? "Disable" : "Enable",
          style: enabled ? ButtonStyle.Danger : ButtonStyle.Success,
        }),
      )
      .addComponents(
        ServerOption.create({
          label: "Set Description",
          style: ButtonStyle.Primary,
        }),
      )
      .addComponents(
        ServerOption.create({
          label: "Back",
          style: ButtonStyle.Secondary,
        }),
      )
      .addComponents(
        ServerOption.create({
          label: "Cancel",
          style: ButtonStyle.Secondary,
        }),
      ),
  ]
};

export default getDiscoveryMenuComponents;
