import { AdminMenu } from "@bot/classes/adminMenu";
import getDiscoveryMenuEmbed from "./embeds/getDiscoveryMenuEmbed";
import handleSetDescription from "./optionHandlers/handleSetDescription";
import setDiscoveryMenuComponents from "./components/setDiscoveryMenuComponents";
import { upsertServer } from "@services/server.service";

const handleDiscoveryMenu = async (menu: AdminMenu): Promise<void> => {
  menu.isBackSelected = false;

  while (!menu.isBackSelected && !menu.isCancelled) {
    menu.prompt =
      menu.prompt ||
      "Select an option to update your Server Discovery settings.";
    menu.isBackSelected = false;
    setDiscoveryMenuComponents(menu);
    if (!menu.server.discovery.enabled && !menu.server.discovery.description) {
      menu.components[0].components[0].setDisabled(true);
    }
    menu.embeds = [await getDiscoveryMenuEmbed(menu)];

    await menu.updateEmbedMessage();

    const selection = await menu.awaitButtonMenuInteraction(120_000);
    if (selection === undefined) continue;

    switch (selection) {
      case "Enable":
      case "Disable":
        menu.prompt = `Successfully ${
          selection === "Enable" ? "enabled" : "disabled"
        } Server Discovery`;
        menu.server.discovery.enabled = !menu.server.discovery.enabled;
        await upsertServer({ serverId: menu.server.serverId }, menu.server);
        break;
      case "Set Description":
        await handleSetDescription(menu);
        break;
      default:
        menu.handleError(new Error("Invalid option selected"));
    }
  }
};

export default handleDiscoveryMenu;
