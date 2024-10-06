import type { AdminMenu } from '@bot/classes';

import setAddPokedexSlotComponents from '../components/setAddPokedexSlotComponents';
import getAddPokedexSlotEmbed from '../embeds/getAddPokedexSlotEmbed';
import handleSearchPokemon from './handleSearchPokemon';

const handleAddPokedexSlot = async (
  menu: AdminMenu,
  pokedexNo: number
): Promise<void> => {
  menu.currentPage = 1;

  while (!menu.isBackSelected && !menu.isCancelled) {
    menu.prompt =
      'This slot is currently empty. Please enter the name of the Pokémon to add to the Pokédex slot.';

    setAddPokedexSlotComponents(menu);
    menu.embeds = [getAddPokedexSlotEmbed(menu, pokedexNo)];

    await menu.updateEmbedMessage();

    const messageResponse: string | undefined =
      await menu.collectMessageOrButtonInteraction(120_000);

    if (messageResponse === undefined) continue;

    console.log('searching for pokemon: ', messageResponse);
    await handleSearchPokemon(menu, pokedexNo, messageResponse);
    if (menu.region.pokedex[pokedexNo - 1]) {
      menu.back();
    }
  }
  menu.isBackSelected = false;
};

export default handleAddPokedexSlot;
