import { AdminMenu } from "@bot/classes/adminMenu";
import getServerMenuEmbed from "../embeds/getServerMenuEmbed";
import handleAddPrefix from "./handleAddPrefix";
import setUpdatePrefixesComponents from "../components/setUpdatePrefixesComponents";
import { upsertServer } from "@services/server.service";

const handleUpdatePrefixes = async (menu: AdminMenu): Promise<void> => {
  menu.currentPage = 1;
  menu.isBackSelected = false;

  while (!menu.isBackSelected && !menu.isCancelled) {
    menu.isBackSelected = false;
    menu.prompt = menu.prompt || "Add or Remove a Prefix.";
    setUpdatePrefixesComponents(menu);
    menu.embeds = [getServerMenuEmbed(menu)];

    await menu.updateEmbedMessage();

    const selection = await menu.awaitButtonMenuInteraction(120_000);
    if (selection === undefined) continue;

    switch (selection) {
      case "Add Prefix":
        await handleAddPrefix(menu);
        break;
      default:
        if (Number.isNaN(+selection)){
          menu.handleError(new Error("Invalid selection Selected"));
        }

        menu.prompt = `Successfully removed the prefix: \`${menu.server
          .prefixes?.[+selection]}\``;
        menu.server.prefixes?.splice(+selection, 1);
        await upsertServer({ serverId: menu.server.serverId }, menu.server);
        break;
    }
  }
};

export default handleUpdatePrefixes;
