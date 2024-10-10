import { ButtonStyle } from 'discord.js';

import type { AdminMenuBuilder } from '@bot/classes';

const setManageRegionMenuComponents = (menu: AdminMenuBuilder): void => {
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
