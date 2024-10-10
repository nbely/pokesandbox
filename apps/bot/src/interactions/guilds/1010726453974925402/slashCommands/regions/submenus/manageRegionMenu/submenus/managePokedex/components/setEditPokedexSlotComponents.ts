import { ButtonStyle } from 'discord.js';

import type { AdminMenuBuilder } from '@bot/classes';

const setEditPokedexSlotComponents = (menu: AdminMenuBuilder): void => {
  menu.paginationOptions = {
    ...menu.paginationOptions,
    buttons: [
      menu.createButton('Customize', ButtonStyle.Primary),
      menu.createButton('Swap', ButtonStyle.Primary),
      menu.createButton('Remove', ButtonStyle.Danger),
    ],
    fixedEndButtons: [],
    fixedStartButtons: [],
    hideBackButton: false,
    type: 'buttons',
  };
};

export default setEditPokedexSlotComponents;
