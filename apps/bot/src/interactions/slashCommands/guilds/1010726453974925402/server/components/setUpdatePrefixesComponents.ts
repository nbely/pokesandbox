import { ButtonStyle } from 'discord.js';

import type { AdminMenu } from '@bot/classes';

const setUpdatePrefixesComponents = (menu: AdminMenu): void => {
  menu.paginationOptions = {
    ...menu.paginationOptions,
    buttons: menu.server.prefixes.map((prefix, index) => {
      return menu.createButton(`Remove ${prefix}`, ButtonStyle.Danger, index);
    }),
    fixedEndButtons: [],
    fixedStartButtons: [menu.createButton('Add Prefix', ButtonStyle.Success)],
  };
};

export default setUpdatePrefixesComponents;
