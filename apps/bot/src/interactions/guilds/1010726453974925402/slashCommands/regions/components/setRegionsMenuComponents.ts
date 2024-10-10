import { ButtonStyle } from 'discord.js';

import type { AdminMenuBuilder } from '@bot/classes';

const setRegionsMenuComponents = (menu: AdminMenuBuilder): void => {
  menu.paginationOptions = {
    ...menu.paginationOptions,
    buttons: menu.regions.map((region, index) => {
      return menu.createButton(`${region.name}`, ButtonStyle.Primary, index);
    }),
    fixedEndButtons: [],
    fixedStartButtons: [
      menu.createButton('Create Region', ButtonStyle.Success),
    ],
    hideBackButton: true,
    type: 'buttons',
  };
};

export default setRegionsMenuComponents;
