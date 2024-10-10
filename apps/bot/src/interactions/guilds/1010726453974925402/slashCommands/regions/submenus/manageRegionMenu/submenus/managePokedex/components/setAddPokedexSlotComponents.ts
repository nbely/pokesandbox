import type { AdminMenuBuilder } from '@bot/classes';

const setAddPokedexSlotComponents = (menu: AdminMenuBuilder): void => {
  menu.paginationOptions = {
    ...menu.paginationOptions,
    buttons: undefined,
    fixedEndButtons: undefined,
    fixedStartButtons: undefined,
    type: 'buttons',
  };
};

export default setAddPokedexSlotComponents;
