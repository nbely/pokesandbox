import { ButtonStyle } from 'discord.js';

import type { AdminMenu } from '@bot/classes';
import type { DexEntry } from '@shared/models';

const setSelectMatchedPokemonComponents = (
  menu: AdminMenu,
  matchedPokemon: DexEntry[]
): void => {
  menu.paginationOptions = {
    ...menu.paginationOptions,
    quantityPerPage: 20,
    nextButtonStyle: ButtonStyle.Primary,
    previousButtonStyle: ButtonStyle.Primary,
    totalQuantity: matchedPokemon.length,
    type: 'list',
  };
};

export default setSelectMatchedPokemonComponents;
