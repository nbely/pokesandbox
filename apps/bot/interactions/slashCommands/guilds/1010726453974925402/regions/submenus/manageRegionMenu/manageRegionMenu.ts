import { AdminMenu } from "@bot/classes/adminMenu";
import getManageRegionMenuEmbed from "./embeds/getManageRegionMenuEmbed";
import handleManagePokedexMenu from "./submenus/managePokedex/managePokedexMenu";
import setManageRegionMenuComponents from "./components/setManageRegionMenuComponents";
import { upsertRegion } from "@services/region.service";

const handleManageRegionMenu = async (menu: AdminMenu): Promise<void> => {
  menu.currentPage = 1;

  while (!menu.isBackSelected && !menu.isCancelled) {
    setManageRegionMenuComponents(menu);
    if (!menu.region.deployable) {
      menu.components[0].components[0].setDisabled(true);
    }
    menu.embeds = [getManageRegionMenuEmbed(menu)];

    await menu.updateEmbedMessage();

    const selection = await menu.awaitButtonMenuInteraction(120_000);
    if (selection === undefined) continue;
      
    switch (selection) {
      case "Deploy":
      case "Undeploy":
        menu.prompt = `Successfully ${
          selection === "Deploy" ? "deployed" : "undeployed"
        } the ${menu.region.name} Region`;
        menu.region.deployed = !menu.region.deployed;
        await upsertRegion({ _id: menu.region._id }, menu.region);
        break;
      case "Pokedex":
        await handleManagePokedexMenu(menu);
        break;
      case "Moves":
        console.log("Moves selected");
        break;
      case "Progression":
        console.log("Progression selected");
        break;
      case "Locations":
        console.log("Locations selected");
        break;
      case "Transportation":
        console.log("Transportation selected");
        break;
      case "Quests":
        console.log("Quests selected");
        break;
      case "Shops":
        console.log("Shops selected");
        break;
      case "Mechanics":
        console.log("Mechanics selected");
        break;
      case "Graphics":
        console.log("Graphics selected");
        break;
      default:
        menu.handleError(new Error("Invalid Option Selected"));
    }
  }
  menu.isBackSelected = false;
};

export default handleManageRegionMenu;
