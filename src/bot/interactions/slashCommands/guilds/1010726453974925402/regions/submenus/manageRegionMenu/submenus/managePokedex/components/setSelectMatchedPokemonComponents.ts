import { ButtonStyle } from "discord.js";

import { AdminMenu } from "@bot/classes/adminMenu";
import type { IDexEntry } from "@models/dexentry.model";

const setSelectMatchedPokemonComponents = (
  menu: AdminMenu,
  matchedPokemon: IDexEntry[]
): void => {
  menu.paginationOptions = {
    ...menu.paginationOptions,
    quantityPerPage: 20,
    nextButtonStyle: ButtonStyle.Primary,
    previousButtonStyle: ButtonStyle.Primary,
    totalQuantity: matchedPokemon.length,
    type: "list",
  };
};

export default setSelectMatchedPokemonComponents;
