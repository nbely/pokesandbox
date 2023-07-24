import { AdminMenu } from "@bot/classes/adminMenu";
import getManageRegionMenuComponents from "./components/getManageRegionMenuComponents";
import getManageRegionMenuEmbed from "./embeds/getManageRegionMenuEmbed";
import { upsertRegion } from "@services/region.service";

const handleManageRegionMenu = async (menu: AdminMenu): Promise<void> => {
  menu.currentPage = 1;
  menu.isBackSelected = false;

  while (!menu.isBackSelected && !menu.isCancelled) {
    menu.isBackSelected = false;
    menu.components = getManageRegionMenuComponents(menu);
    if (!menu.region.deployable) {
      menu.components[0].components[0].setDisabled(true);
    }
    menu.embeds = [getManageRegionMenuEmbed(menu)];

    await menu.handleMenuReset();

    try {
      const option = await menu.awaitButtonMenuInteraction(120_000);

      switch (option) {
        case "Deploy":
        case "Undeploy":
          menu.prompt = `Successfully ${
            option === "Deploy" ? "deployed" : "undeployed"
          } the ${menu.region.name} Region`;
          menu.region.deployed = !menu.region.deployed;
          await upsertRegion({ _id: menu.region._id }, menu.region);
          break;
        case "Pokedex":
          console.log("Pokedex selected");
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
        case "Next":
          menu.currentPage++;
          break;
        case "Previous":
          menu.currentPage--;
          break;
        case "Back":
          menu.back();
          break;
        case "Cancel":
          await menu.cancel();
          break;
        default:
          throw new Error("Invalid Option Selected");
      }
    } catch (error) {
      await menu.handleError(error);
    }
  }
};

export default handleManageRegionMenu;
