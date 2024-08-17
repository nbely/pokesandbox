import { AdminMenu } from "@bot/classes/adminMenu";

const setAddPokedexSlotComponents = (menu: AdminMenu): void => {
  menu.paginationOptions = {
    ...menu.paginationOptions,
    buttons: undefined,
    fixedEndButtons: undefined,
    fixedStartButtons: undefined,
    type: "buttons",
  };
};

export default setAddPokedexSlotComponents;
