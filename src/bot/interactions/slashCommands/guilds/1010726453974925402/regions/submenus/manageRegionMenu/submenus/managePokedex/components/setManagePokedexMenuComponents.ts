import { AdminMenu } from "@bot/classes/adminMenu";

const setManageRegionMenuComponents = (menu: AdminMenu): void => {
  menu.paginationOptions = {
    ...menu.paginationOptions,
    quantityPerPage: 20,
    totalQuantity: menu.region.pokedex.length,
    type: "list",
  }
};

export default setManageRegionMenuComponents;
