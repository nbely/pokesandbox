import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

import { AdminMenu } from "@bot/classes/adminMenu";
import ServerOption from "@bot/interactions/buttons/server/option";
import paginateButtons from "@bot/utils/paginateButtons";

const getPrefixMenuComponents = (
  menu: AdminMenu,
): ActionRowBuilder<ButtonBuilder>[] => {
  const fixedStartButtons: ButtonBuilder[] = [
    ServerOption.create({ label: "Add Prefix", style: ButtonStyle.Success }),
  ];

  const fixedEndButtons: ButtonBuilder[] = [
    ServerOption.create({ label: "Back", style: ButtonStyle.Secondary }),
    ServerOption.create({ label: "Cancel", style: ButtonStyle.Secondary }),
  ];

  let removePrefixButtons: ButtonBuilder[] = [];
  if (menu.server?.prefixes) {
    removePrefixButtons = menu.server.prefixes.map((prefix, index) => {
      return ServerOption.create({
        label: `Remove ${prefix}`,
        style: ButtonStyle.Danger,
        id: index,
      });
    });
  }

  return paginateButtons(
    removePrefixButtons,
    menu.currentPage,
    fixedStartButtons,
    fixedEndButtons,
  );
};

export default getPrefixMenuComponents;
