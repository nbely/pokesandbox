import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

import ServerOption from "@bot/interactions/buttons/server/option";

/**
 * Creates the action row buttons for the discovery menu
 * @returns {ActionRowBuilder<ButtonBuilder>[]} - The action row buttons for the discovery menu
 */
const createDiscoveryMenu = (
  enabled?: boolean,
): ActionRowBuilder<ButtonBuilder>[] => {
  const actionRow = new ActionRowBuilder<ButtonBuilder>();
  if (enabled) {
    actionRow.addComponents(
      ServerOption.create({ label: "Disable", style: ButtonStyle.Danger }),
    );
  } else {
    actionRow.addComponents(
      ServerOption.create({ label: "Enable", style: ButtonStyle.Success }),
    );
  }
  actionRow
    .addComponents(
      ServerOption.create({
        label: "Set Description",
        style: ButtonStyle.Primary,
      }),
    )
    .addComponents(
      ServerOption.create({ label: "Back", style: ButtonStyle.Secondary }),
    )
    .addComponents(
      ServerOption.create({ label: "Cancel", style: ButtonStyle.Secondary }),
    );

  return [actionRow];
};

export default createDiscoveryMenu;
