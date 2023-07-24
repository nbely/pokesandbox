import { AdminMenu } from "@bot/classes/adminMenu";
import getServerMenuEmbed from "../embeds/getServerMenuEmbed";
import getUpdatePrefixesComponents from "../components/getUpdatePrefixesComponents";
import handleAddPrefix from "./handleAddPrefix";
import { upsertServer } from "@services/server.service";

const handleUpdatePrefixes = async (menu: AdminMenu): Promise<void> => {
  menu.currentPage = 1;
  menu.isBackSelected = false;
  
  while (!menu.isBackSelected && !menu.isCancelled) {
    menu.isBackSelected = false;
    menu.prompt = menu.prompt || "Add or Remove a Prefix.";
    menu.components = getUpdatePrefixesComponents(menu);
    menu.embeds = [getServerMenuEmbed(menu)];

    await menu.handleMenuReset();

    try {
      const option = await menu.awaitButtonMenuInteraction(120_000);

      switch (option) {
        case "Back":
          menu.back();
          break;
        case "Cancel":
          await menu.cancel();
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
