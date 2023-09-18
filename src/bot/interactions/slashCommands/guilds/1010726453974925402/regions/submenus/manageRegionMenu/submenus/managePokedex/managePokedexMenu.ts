import { AdminMenu } from "@bot/classes/adminMenu";
import setManagePokedexMenuComponents from "./components/setManagePokedexMenuComponents";
import getManagePokedexMenuEmbed from "./embeds/getManagePokedexMenuEmbed";
// import { upsertRegion } from "@services/region.service";

const handleManagePokedexMenu = async (menu: AdminMenu): Promise<void> => {
  menu.currentPage = 1;
  menu.isBackSelected = false;

  while (!menu.isBackSelected && !menu.isCancelled) {
    menu.isBackSelected = false;
    setManagePokedexMenuComponents(menu);
    menu.embeds = [getManagePokedexMenuEmbed(menu)];

    await menu.updateEmbedMessage();
    
    const response = await menu.collectMessageOrButtonInteraction(120_000);
  }
  menu.isBackSelected = false;
};

export default handleManagePokedexMenu;
