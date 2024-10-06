import type { AdminMenu } from '@bot/classes';

const setAddPokedexSlotComponents = (menu: AdminMenu): void => {
  menu.paginationOptions = {
    ...menu.paginationOptions,
    buttons: undefined,
    fixedEndButtons: undefined,
    fixedStartButtons: undefined,
    type: 'buttons',
  };
};

export default setAddPokedexSlotComponents;
