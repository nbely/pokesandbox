import type { AdminMenu } from '@bot/classes';

import setManagePokedexMenuComponents from './components/setManagePokedexMenuComponents';
import getManagePokedexMenuEmbed from './embeds/getManagePokedexMenuEmbed';
import handleAddPokedexSlot from './optionHandlers/handleAddPokedexSlot';
import handleEditPokedexSlot from './optionHandlers/handleEditPokedexSlot';
import handleSearchPokemon from './optionHandlers/handleSearchPokemon';

const handleManagePokedexMenu = async (menu: AdminMenu): Promise<void> => {
  menu.currentPage = 1;

  while (!menu.isBackSelected && !menu.isCancelled) {
    menu.prompt =
      'Enter a space-separated Pokédex number (up to 1500) and Pokémon name to add a Pokémon to a blank Pokédex slot, or enter just a number to modify a Pokédex slot';

    setManagePokedexMenuComponents(menu);
    menu.embeds = [getManagePokedexMenuEmbed(menu)];

    await menu.updateEmbedMessage();

    const messageResponse: string | undefined =
      await menu.collectMessageOrButtonInteraction(120_000);
    if (messageResponse === undefined) continue;

    const messageArgs: string[] = messageResponse.split(' ');
    const pokedexNumber: number = +messageArgs[0];

    if (
      Number.isNaN(pokedexNumber) ||
      pokedexNumber < 1 ||
      pokedexNumber > 1500
    ) {
      menu.handleError(new Error('Please enter a valid Pokédex number'));
    } else if (messageArgs.length < 2) {
      if (menu.region.pokedex[pokedexNumber - 1] === null) {
        console.log('Adding new pokedex slot');
        await handleAddPokedexSlot(menu, pokedexNumber);
      } else {
        console.log('Editing existing pokedex slot');
        await handleEditPokedexSlot(menu, pokedexNumber);
      }
    } else {
      const pokemonName: string = messageArgs.slice(1).join(' ');
      await handleSearchPokemon(menu, pokedexNumber, pokemonName);
    }
  }
  menu.isBackSelected = false;
};

export default handleManagePokedexMenu;
