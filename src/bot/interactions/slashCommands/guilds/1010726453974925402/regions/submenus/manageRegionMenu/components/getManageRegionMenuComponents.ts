import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

import { AdminMenu } from "@bot/classes/adminMenu";
import ServerOption from "@bot/interactions/buttons/server/option";
import paginateButtons from "@bot/utils/paginateButtons";

const getManageRegionMenuComponents = (
  menu: AdminMenu,
): ActionRowBuilder<ButtonBuilder>[] => {
  const fixedStartButtons: ButtonBuilder[] = [
    ServerOption.create({
      label: menu.region.deployed ? "Undeploy" : "Deploy",
      style: menu.region.deployed ? ButtonStyle.Danger : ButtonStyle.Success,
    }),
  ];
  const fixedEndButtons: ButtonBuilder[] = [
    ServerOption.create({ label: "Back", style: ButtonStyle.Secondary }),
    ServerOption.create({ label: "Cancel", style: ButtonStyle.Secondary }),
  ];

  const manageRegionButtons: ButtonBuilder[] = [
    ServerOption.create({
      label: "1",
      style: ButtonStyle.Primary,
      id: "Pokedex",
    }),
    ServerOption.create({
      label: "2",
      style: ButtonStyle.Primary,
      id: "Moves",
    }),
    ServerOption.create({
      label: "3",
      style: ButtonStyle.Primary,
      id: "Progression",
    }),
    ServerOption.create({
      label: "4",
      style: ButtonStyle.Primary,
      id: "Locations",
    }),
    ServerOption.create({
      label: "5",
      style: ButtonStyle.Primary,
      id: "Transportation",
    }),
    ServerOption.create({
      label: "6",
      style: ButtonStyle.Primary,
      id: "Quests",
    }),
    ServerOption.create({
      label: "7",
      style: ButtonStyle.Primary,
      id: "Shops",
    }),
    ServerOption.create({
      label: "8",
      style: ButtonStyle.Primary,
      id: "Mechanics",
    }),
    ServerOption.create({
      label: "9",
      style: ButtonStyle.Primary,
      id: "Graphics",
    }),
  ];

  return paginateButtons(
    manageRegionButtons,
    menu.currentPage,
    fixedStartButtons,
    fixedEndButtons,
    ButtonStyle.Secondary,
    ButtonStyle.Secondary,
  );
};

export default getManageRegionMenuComponents;
