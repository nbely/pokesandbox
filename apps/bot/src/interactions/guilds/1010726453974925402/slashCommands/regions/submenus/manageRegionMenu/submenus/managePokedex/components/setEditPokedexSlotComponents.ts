import { ButtonStyle } from 'discord.js';

import type { AdminMenu } from '@bot/classes';

const setEditPokedexSlotComponents = (menu: AdminMenu): void => {
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
