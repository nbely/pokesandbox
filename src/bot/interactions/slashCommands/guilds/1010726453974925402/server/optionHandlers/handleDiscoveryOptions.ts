import { AdminMenu } from "@bot/classes/adminMenu";
import getDiscoveryMenuComponents from "../components/getDiscoveryMenuComponents";
import getDiscoveryOptionsEmbed from "../embeds/getDiscoveryMenuEmbed";
import handleSetDescription from "./handleSetDescription";
import { upsertServer } from "@services/server.service";

const handleDiscoveryOptions = async (menu: AdminMenu): Promise<void> => {
  let isBackSelected = false;
  menu.prompt = "Select an option to update your Server Discovery settings.";

  while (!menu.isCancelled && !isBackSelected) {
    menu.components = getDiscoveryMenuComponents(menu.server.discovery.enabled);
    if (!menu.server.discovery.enabled && !menu.server.discovery.description) {
      menu.components[0].components[0].setDisabled(true);
    }
    menu.embeds = [await getDiscoveryOptionsEmbed(menu)];

    await menu.handleMenuReset();

    try {
      // TODO: Change timeout later
      const option = await menu.awaitButtonMenuInteraction(60_000);

      switch (option) {
        case "Back":
          menu.prompt = "";
          isBackSelected = true;
          break;
        case "Cancel":
          await menu.cancelMenu();
          break;
        case "Enable":
        case "Disable":
          menu.prompt = `Successfully ${
            option === "Enable" ? "enabled" : "disabled"
          } Server Discovery`;
          menu.server.discovery.enabled = !menu.server.discovery.enabled;
          await upsertServer({ serverId: menu.server.serverId }, menu.server);
          break;
        case "Set Description":
          await handleSetDescription(menu);
          break;
        default:
          throw new Error("Invalid option selected");
      }
    } catch (error) {
      await menu.handleError(error);
    }
  }
};

export default handleDiscoveryOptions;
