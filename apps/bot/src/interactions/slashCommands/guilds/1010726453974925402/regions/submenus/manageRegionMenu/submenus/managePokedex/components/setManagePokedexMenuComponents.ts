import { ButtonStyle } from 'discord.js';

import type { AdminMenu } from '@bot/classes';

const setManageRegionMenuComponents = (menu: AdminMenu): void => {
  menu.paginationOptions = {
    ...menu.paginationOptions,
    quantityPerPage: 50,
    nextButtonStyle: ButtonStyle.Primary,
    previousButtonStyle: ButtonStyle.Primary,
    totalQuantity: menu.region.pokedex.length,
    type: 'list',
  };
};

export default setManageRegionMenuComponents;
