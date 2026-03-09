import { AdminMenu } from '@bot/classes';
import { MenuWorkflow } from '@flowcord';
import { EditPokedexSlotCommandOptions } from './editPokedexSlot';
import { ManagePokedexCommandOptions } from './managePokedex';
import { searchPokemon } from '@bot/utils';
import { SELECT_MATCHED_POKEMON_COMMAND_NAME } from './selectMatchedPokemon';
import { DexEntry, Region } from '@shared/models';
import { saveRegion } from '@bot/cache';

export const handleAddPokemonToSlot = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  menu: AdminMenu<any>,
  regionId: string,
  pokedexNo: string,
  pokemonName: string
) => {
  const server = await menu.getServer();
  const region = await menu.getRegion(regionId);

  const { exactMatch, potentialMatches } = await searchPokemon(
    server._id.toString(),
    pokemonName
  );

  if (exactMatch) {
    await handlePokemonSelected(menu, exactMatch, region, pokedexNo);
    return;
  }

  if (potentialMatches.length) {
    return MenuWorkflow.openSubMenuWithContinuation(
      menu,
      SELECT_MATCHED_POKEMON_COMMAND_NAME,
      async (_session, selectedPokemonId: string) => {
        const selectedPokemon = potentialMatches.find(
          (match) => match._id.toString() === selectedPokemonId
        );

        if (!selectedPokemon) {
          menu.prompt = `Selected Pokémon not found. Please try again.`;
          return menu.refresh();
        }

        await handlePokemonSelected(menu, selectedPokemon, region, pokedexNo);
      },
      {
        regionId: region._id.toString(),
        matchedDexEntryIds: potentialMatches.map((match) =>
          match._id.toString()
        ),
      }
    );
  }

  menu.prompt = `No Pokémon found with the name "${pokemonName}". Please try again.`;
  return menu.refresh();
};

export const handlePokemonSelected = async (
  menu:
    | AdminMenu<EditPokedexSlotCommandOptions>
    | AdminMenu<ManagePokedexCommandOptions>,
  selectedPokemon: DexEntry,
  region: Region,
  pokedexNo: string
) => {
  if (region.pokedex.some((pkmn) => pkmn?.id.equals(selectedPokemon._id))) {
    menu.prompt = `The Pokémon "${selectedPokemon.name}" is already in the Pokédex. Please choose a different Pokémon.`;
    return menu.refresh();
  } else {
    region.pokedex[+pokedexNo - 1] = {
      id: selectedPokemon._id,
      name: selectedPokemon.name,
    };
    await saveRegion(region);
    return menu.hardRefresh();
  }
};
