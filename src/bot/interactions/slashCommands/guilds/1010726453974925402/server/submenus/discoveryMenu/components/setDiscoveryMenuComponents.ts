import { ButtonStyle } from "discord.js";

import { AdminMenu } from "@bot/classes/adminMenu";

const setDiscoveryMenuComponents = (menu: AdminMenu): void => {
  menu.paginationOptions = {
    ...menu.paginationOptions,
    buttons: [
      menu.createButton(
        menu.server.discovery.enabled ? "Disable" : "Enable",
        menu.server.discovery.enabled ? ButtonStyle.Danger : ButtonStyle.Success,
      ),
      menu.createButton("Set Description", ButtonStyle.Primary),
    ],
    fixedEndButtons: [],
    fixedStartButtons: [],
    hideBackButton: false,
  };
};

export default setDiscoveryMenuComponents;
