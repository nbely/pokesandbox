import { ButtonStyle } from "discord.js";

import { AdminMenu } from "@bot/classes/adminMenu";

const setRegionsMenuComponents = (menu: AdminMenu): void=> {
  menu.paginationOptions = {
    ...menu.paginationOptions,
    buttons: menu.regions.map((region, index) => {
      return menu.createButton(`${region.name}`, ButtonStyle.Primary, index);
    }),
    fixedEndButtons: [],
    fixedStartButtons: [
      menu.createButton("Create Region", ButtonStyle.Success),
    ],
    hideBackButton: true,
    type: "buttons",
  }
};

export default setRegionsMenuComponents;
