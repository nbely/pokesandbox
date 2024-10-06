import type { AdminMenu } from '@bot/classes';
import type { DexEntry } from '@shared/models';
import { findDexEntries, upsertRegion } from '@shared/services';

import handleSelectMatchedPokemon from './handleSelectMatchedPokemon';

const handleSearchPokemon = async (
  menu: AdminMenu,
  pokedexNo: number,
  pokemonName: string
): Promise<void> => {
  let matchedPokemon: DexEntry[] = await findDexEntries({
    $and: [
      { baseSpecies: undefined },
      {
        $or: [
          { name: { $regex: new RegExp(pokemonName, 'i') } },
          { showdownName: pokemonName.toLowerCase().replace(/[^a-zA-Z]/g, '') },
        ],
      },
      { $or: [{ isCanon: true }, { originServer: menu.server._id }] },
    ],
  });

  let pokemonIdentified = false;
  if (matchedPokemon.length === 0) {
    console.log('No Pokemon found');
    menu.info = 'No Pokemon found, please try again!';
    return;
  } else if (matchedPokemon.length === 1) {
    console.log('matched 1 Pokemon: ', matchedPokemon);
    pokemonIdentified = true;
  } else if (matchedPokemon.length > 1) {
    console.log('matched multiple Pokemon: ', matchedPokemon);
    for (const pokemon of matchedPokemon) {
      if (
        pokemon.name.toLowerCase().replace(/[^a-zA-Z]/g, '') ===
        pokemonName.toLowerCase().replace(/[^a-zA-Z]/g, '')
      ) {
        pokemonIdentified = true;
        matchedPokemon = [pokemon];
        break;
      }
    }

    if (!pokemonIdentified) {
      const selectedPokemon: DexEntry | undefined =
        await handleSelectMatchedPokemon(menu, pokedexNo, matchedPokemon);

      if (selectedPokemon) {
        matchedPokemon = [selectedPokemon];
        pokemonIdentified = true;
      }
    }
  }

  if (pokemonIdentified) {
    console.log('Pokemon identified: ', matchedPokemon[0].name);
    try {
      if (menu.region.pokedex.some((p) => p?.name === matchedPokemon[0].name)) {
        console.log('Pokemon already exists in pokedex');
        menu.info = `Cannot assign ${matchedPokemon[0].name} to Pokédex slot #${pokedexNo}. This Pokémon already exists in this Pokédex! Please try again.`;
        return;
      }
      console.log(matchedPokemon);
      menu.region.pokedex[pokedexNo - 1] = {
        id: matchedPokemon[0]._id,
        name: matchedPokemon[0].name,
      };
      await upsertRegion({ _id: menu.region._id }, menu.region);
      menu.info = `${matchedPokemon[0].name} successfully added to Pokédex slot ${pokedexNo}!`;
      menu.thumbnail = matchedPokemon[0].sprites.g5?.bw?.normal.front;
      return;
    } catch (err) {
      console.log('Error adding pokemon to pokedex: ', err);
      menu.handleError(err);
      return;
    }
  }

  return;
};

export default handleSearchPokemon;
