import { z } from 'zod';
import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { getAssertedCachedRegion } from '@bot/cache';
import { AdminMenuBuilder } from '@bot/classes';
import {
  handleRegionAutocomplete,
  onlyAdminRoles,
  parseCommandOptions,
} from '@bot/utils';
import { ISlashCommand } from '@bot/structures/interfaces';
import { getSwapPokedexSlotMenuEmbeds } from './pokedex.embeds';
import {
  handleAddPokemonToSlot,
  removePokedexSlot,
} from './pokedexHelperFunctions';
import { MANAGE_POKEDEX_COMMAND_NAME } from './managePokedex';
import { Region } from '@shared/models';
import { MenuSessionLike } from '@flowcord';

const COMMAND_NAME = 'swap-pokedex-slot';

const SwapPokedexSlotCommandOptionsSchema = z.object({
  region_id: z.string().min(1),
  pokedex_no: z
    .union([z.string(), z.number()])
    .transform((value) => `${value}`)
    .refine((value) => {
      const pokedexNumber = Number(value);
      return (
        Number.isInteger(pokedexNumber) &&
        pokedexNumber >= 1 &&
        pokedexNumber <= 1500
      );
    }, 'Must be an integer between 1 and 1500')
    .optional(),
  pokemon_name: z.string().min(3).max(14),
});

export const SwapPokedexSlotCommand: ISlashCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  autocomplete: handleRegionAutocomplete,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Swap in a Pokémon into the specified Pokédex slot')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('region_id')
        .setDescription('The region to manage')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('pokemon_name')
        .setDescription('The Pokémon name to swap out')
        .setRequired(true)
    ),
  createMenu: async (session, options) => {
    const {
      region_id: regionId,
      pokedex_no,
      pokemon_name: pokemonName,
    } = parseCommandOptions(SwapPokedexSlotCommandOptionsSchema, options);
    const region = await getAssertedCachedRegion(regionId);
    const pokedexNo = getPokedexNo(session, pokemonName, region, pokedex_no);
    if (!pokedexNo) {
      throw new Error(
        `Could not find a Pokédex entry with the name "${pokemonName}". Please ensure the Pokémon is already in the Pokédex before trying to swap it into a slot.`
      );
    }

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setMessageHandler(async (ctx, response) => {
        // handle the swap logic here, then update the menu embeds to reflect the changes

        // perform the swap in the database or cache
        const pokedexSlot = removePokedexSlot(region, +pokedexNo - 1);
        await handleAddPokemonToSlot(
          ctx,
          regionId,
          pokedexNo,
          response,
          MANAGE_POKEDEX_COMMAND_NAME
        );
        if (!region.pokedex[+pokedexNo - 1]) {
          region.pokedex[+pokedexNo - 1] = pokedexSlot;
        }
      })
      .setEmbeds((ctx) =>
        getSwapPokedexSlotMenuEmbeds(ctx, regionId, pokedexNo)
      )
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build();
  },
};

const getPokedexNumberFromName = (
  pokemonName: string,
  region: Region
): string | undefined => {
  const pokedexEntryIndex = region.pokedex.findIndex(
    (entry) => entry?.name.toLowerCase() === pokemonName.toLowerCase()
  );
  return pokedexEntryIndex !== -1 ? `${pokedexEntryIndex + 1}` : undefined;
};

const getPokedexNo = (
  session: MenuSessionLike,
  pokemonName: string,
  region: Region,
  givenPokedexNo?: string
): string | undefined => {
  let pokedexNo = session.sessionState.get('resolvedPokedexNo') as
    | string
    | undefined;
  if (!pokedexNo) {
    pokedexNo = givenPokedexNo;
  }
  if (!pokedexNo && pokemonName) {
    pokedexNo = getPokedexNumberFromName(pokemonName, region);
    session.sessionState.set('resolvedPokedexNo', pokedexNo);
  }
  return pokedexNo;
};
