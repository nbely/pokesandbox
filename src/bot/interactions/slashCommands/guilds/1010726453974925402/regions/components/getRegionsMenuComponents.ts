import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

import { AdminMenu } from "@bot/classes/adminMenu";
import ServerOption from "@bot/interactions/buttons/server/option";
import paginateButtons from "@bot/utils/paginateButtons";

const getRegionsMenuComponents = (
  menu: AdminMenu,
): ActionRowBuilder<ButtonBuilder>[] => {
  const fixedStartButtons: ButtonBuilder[] = [
    ServerOption.create({ label: "Create Region", style: ButtonStyle.Success }),
  ];
  const fixedEndButtons: ButtonBuilder[] = [
    ServerOption.create({ label: "Cancel", style: ButtonStyle.Secondary }),
  ];

  const manageRegionButtons = menu.regions.map((region, index) => {
    return ServerOption.create({
      label: `${region.name}`,
      style: ButtonStyle.Primary,
      id: index,
    });
  });

  return paginateButtons(
    manageRegionButtons,
    menu.currentPage,
    fixedStartButtons,
    fixedEndButtons,
  );
};

export default getRegionsMenuComponents;
