import type { AdminMenu } from '@bot/classes';
import type { DexEntry } from '@shared/models';

import setSelectMatchedPokemonComponents from '../components/setSelectMatchedPokemonComponents';
import getSelectMatchedPokemonEmbed from '../embeds/getSelectMatchedPokemonEmbed';

const handleSelectMatchedPokemon = async (
  menu: AdminMenu,
  pokedexNo: number,
  matchedPokemon: DexEntry[]
): Promise<DexEntry | undefined> => {
  let selectedPokemon: DexEntry | undefined;
  menu.currentPage = 1;
  menu.prompt =
    'Multiple matching Pokémon found, please enter the option number of the Pokémon to add to the Pokédex slot.';

  while (!menu.isBackSelected && !menu.isCancelled) {
    setSelectMatchedPokemonComponents(menu, matchedPokemon);
    menu.embeds = [
      getSelectMatchedPokemonEmbed(menu, pokedexNo, matchedPokemon),
    ];

    await menu.updateEmbedMessage();

    const messageResponse: string | undefined =
      await menu.collectMessageOrButtonInteraction(120_000);
    if (messageResponse === undefined) continue;

    const messageArgs: string[] = messageResponse.split(' ');
    const optionNumber: number = +messageArgs[0];

    if (
      Number.isNaN(optionNumber) ||
      optionNumber < 1 ||
      optionNumber > matchedPokemon.length + 1
    ) {
      menu.handleError(new Error('Please enter a valid option number'));
    } else {
      const optionIndex: number = +messageArgs[0];
      selectedPokemon = matchedPokemon[optionIndex - 1];

      menu.back();
    }
  }
  menu.isBackSelected = false;
  return selectedPokemon;
};

export default handleSelectMatchedPokemon;
