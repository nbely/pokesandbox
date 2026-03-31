import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { getAssertedCachedRegion } from '@bot/cache';
import { AdminMenuBuilder } from '@bot/classes';
import {
  handleRegionAndPokedexNoOrNameAutocomplete,
  onlyAdminRoles,
  parseCommandOptions,
} from '@bot/utils';
import { ISlashCommand } from '@bot/structures/interfaces';
import { getSwapPokedexSlotMenuEmbeds } from './pokedex.embeds';
import {
  handleAddPokemonToSlot,
  removePokedexSlot,
} from './pokedexHelperFunctions';
import { EDIT_POKEDEX_SLOT_COMMAND_NAME } from './editPokedexSlot';
import { pokedexNoCommandOptionsSchema } from './schemas';

const COMMAND_NAME = 'swap-pokedex-slot';
export const SWAP_POKEDEX_SLOT_COMMAND_NAME = COMMAND_NAME;

export const SwapPokedexSlotCommand: ISlashCommand = {
  name: SWAP_POKEDEX_SLOT_COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  autocomplete: handleRegionAndPokedexNoOrNameAutocomplete,
  command: new SlashCommandBuilder()
    .setName(SWAP_POKEDEX_SLOT_COMMAND_NAME)
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
        .setName('pokedex_no')
        .setDescription('The Pokémon name or Pokédex number to swap out')
        .setRequired(true)
        .setAutocomplete(true)
    ),
  createMenu: async (session, options) => {
    const { region_id: regionId, pokedex_no: pokedexNo } = parseCommandOptions(
      pokedexNoCommandOptionsSchema,
      options
    );
    const region = await getAssertedCachedRegion(regionId);

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setMessageHandler(async (ctx, response) => {
        const pokedexSlot = removePokedexSlot(region, +pokedexNo - 1);
        await handleAddPokemonToSlot(ctx, regionId, pokedexNo, response, {
          commandName: EDIT_POKEDEX_SLOT_COMMAND_NAME,
          navigatePayload: { region_id: regionId, pokedex_no: pokedexNo },
        });
        // if a Pokémon isn't added back into the slot (e.g. if the user cancels out of the add flow), add the original Pokémon back into the slot to prevent it from being lost
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
