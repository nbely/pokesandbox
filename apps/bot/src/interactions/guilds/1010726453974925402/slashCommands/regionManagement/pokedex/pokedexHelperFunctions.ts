import type { AdminMenuContext } from '@bot/classes';
import { searchPokemon } from '@bot/utils';
import { SELECT_MATCHED_POKEMON_COMMAND_NAME } from './selectMatchedPokemon';
import type { DexEntry, Region } from '@shared/models';
import { saveRegion } from '@bot/cache';
import { Types } from 'mongoose';
import { NavigateMenuOptions } from './types';

export const handleAddPokemonToSlot = async (
  ctx: AdminMenuContext,
  regionId: string,
  pokedexNo: string,
  pokemonName: string,
  navigateToMenuOptions?: NavigateMenuOptions
) => {
  const server = await ctx.admin.getServer();
  const region = await ctx.admin.getRegion(regionId);

  const { exactMatch, potentialMatches } = await searchPokemon(
    server._id.toString(),
    pokemonName
  );

  if (exactMatch) {
    await handlePokemonSelected(
      ctx,
      exactMatch,
      region,
      pokedexNo,
      navigateToMenuOptions
    );
    return;
  }

  if (potentialMatches.length) {
    return ctx.openSubMenu(SELECT_MATCHED_POKEMON_COMMAND_NAME, {
      onComplete: async (innerCtx, result) => {
        const adminCtx = innerCtx as AdminMenuContext;
        const selectedPokemonId = result as string;
        const selectedPokemon = potentialMatches.find(
          (match) => match._id.toString() === selectedPokemonId
        );

        if (!selectedPokemon) {
          adminCtx.state.set(
            'prompt',
            'Selected Pokémon not found. Please try again.'
          );
          return;
        }

        await handlePokemonSelected(
          adminCtx,
          selectedPokemon,
          region,
          pokedexNo,
          navigateToMenuOptions
        );
      },
      regionId: region._id.toString(),
      matchedDexEntryIds: potentialMatches.map((match) => match._id.toString()),
    });
  }

  ctx.state.set(
    'prompt',
    `No Pokémon found with the name "${pokemonName}". Please try again.`
  );
};

export const handlePokemonSelected = async (
  ctx: AdminMenuContext,
  selectedPokemon: DexEntry,
  region: Region,
  pokedexNo: string,
  navigateToMenuOptions?: NavigateMenuOptions
) => {
  if (region.pokedex.some((pkmn) => pkmn?.id.equals(selectedPokemon._id))) {
    ctx.state.set(
      'prompt',
      `The Pokémon "${selectedPokemon.name}" is already in the Pokédex. Please choose a different Pokémon.`
    );
  } else {
    region.pokedex[+pokedexNo - 1] = {
      id: selectedPokemon._id,
      name: selectedPokemon.name,
    };
    await saveRegion(region);
    if (navigateToMenuOptions) {
      await ctx.goTo(
        navigateToMenuOptions.commandName,
        navigateToMenuOptions.navigatePayload
      );
    }
    await ctx.hardRefresh();
  }
};

export const removePokedexSlot = (
  region: Region,
  pokedexIndex: number
): { name: string; id: Types.ObjectId } | null => {
  const pokedexEntry = region.pokedex[pokedexIndex];
  region.pokedex[pokedexIndex] = null;
  removeNullsFromEndOfPokedex(region);
  return pokedexEntry;
};

const removeNullsFromEndOfPokedex = (region: Region): void => {
  while (region.pokedex[region.pokedex.length - 1] === null) {
    region.pokedex.pop();
  }
};
