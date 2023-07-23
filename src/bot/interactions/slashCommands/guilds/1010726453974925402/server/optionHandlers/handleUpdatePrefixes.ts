import { AdminMenu } from "@bot/classes/adminMenu";
import getPrefixMenuComponents from "../components/getPrefixMenuComponents";
import getServerOptionsEmbed from "../embeds/getServerMenuEmbed";
import handleAddPrefix from "./handleAddPrefix";
import { upsertServer } from "@services/server.service";

const handleUpdatePrefixes = async (menu: AdminMenu): Promise<void> => {
  let isBackSelected = false;
  menu.currentPage = 1;
  menu.prompt = "Add or Remove a Prefix.";

  while (!menu.isCancelled && !isBackSelected) {
    menu.components = getPrefixMenuComponents(menu);
    menu.embeds = [getServerOptionsEmbed(menu)];

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
        case "Next":
          menu.currentPage++;
          break;
        case "Previous":
          menu.currentPage--;
          break;
        case "Add Prefix":
          await handleAddPrefix(menu);
          break;
        default:
          if (!option || Number.isNaN(+option))
            throw new Error("Invalid Option Selected");

          menu.prompt = `Successfully removed the prefix: \`${menu.server
            .prefixes?.[+option]}\``;
          menu.server.prefixes?.splice(+option, 1);
          await upsertServer({ serverId: menu.server.serverId }, menu.server);
          break;
      }
    } catch (error) {
      await menu.handleError(error);
    }
  }
};

export default handleUpdatePrefixes;
