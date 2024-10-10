import { ButtonStyle } from 'discord.js';

import type { AdminMenuBuilder } from '@bot/classes';

const setServerMenuComponents = (menu: AdminMenuBuilder): void => {
  menu.paginationOptions = {
    ...menu.paginationOptions,
    buttons: [
      menu.createButton('1', ButtonStyle.Primary, 'Prefix'),
      menu.createButton('2', ButtonStyle.Primary, 'Admin'),
      menu.createButton('3', ButtonStyle.Primary, 'Mod'),
      menu.createButton('4', ButtonStyle.Primary, 'Discovery'),
    ],
    fixedEndButtons: [],
    fixedStartButtons: [],
  };
};

export default setServerMenuComponents;
