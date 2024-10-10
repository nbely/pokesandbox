import { ButtonStyle } from 'discord.js';

import type { AdminMenuBuilder } from '@bot/classes';
import type { DexEntry } from '@shared/models';

const setSelectMatchedPokemonComponents = (
  menu: AdminMenuBuilder,
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
