import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { z } from 'zod';

import { getAssertedCachedRegion } from '@bot/cache';
import { AdminMenuBuilderV2 } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import {
  handleRegionAutocomplete,
  onlyAdminRoles,
  parseCommandOptions,
} from '@bot/utils';

import { EDIT_POKEDEX_SLOT_COMMAND_NAME } from './editPokedexSlot';
import { getManagePokedexMenuEmbeds } from './pokedex.embeds';
import { handleAddPokemonToSlot } from './pokedexHelperFunctions';
import type { PokedexMenuState } from './types';

const COMMAND_NAME = 'manage-pokedex';
export const MANAGE_POKEDEX_COMMAND_NAME = COMMAND_NAME;

const managePokedexCommandOptionsSchema = z.object({
  region_id: z.string().min(1),
});

export const ManagePokedexCommand: ISlashCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  autocomplete: handleRegionAutocomplete,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Manage the Pokédex for one of your PokéSandbox Regions')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('region_id')
        .setDescription('The region to manage')
        .setRequired(true)
        .setAutocomplete(true)
    ),
  createMenuV2: async (session, options) => {
    const { region_id } = parseCommandOptions(
      managePokedexCommandOptionsSchema,
      options
    );

    return new AdminMenuBuilderV2<PokedexMenuState>(
      session,
      COMMAND_NAME,
      options
    )
      .setEmbeds((ctx) => getManagePokedexMenuEmbeds(ctx, region_id))
      .setCancellable()
      .setListPagination({
        itemsPerPage: 50,
        getTotalQuantityItems: async () => {
          const region = await getAssertedCachedRegion(region_id);
          return region.pokedex.length;
        },
      })
      .setMessageHandler(async (ctx, response) => {
        const messageArgs: string[] = response.split(' ');
        const pokedex_no: number = +messageArgs[0];

        if (Number.isNaN(pokedex_no) || pokedex_no < 1 || pokedex_no > 1500) {
          ctx.state.set('prompt', 'Please enter a valid Pokédex number');
        } else if (messageArgs.length < 2) {
          await ctx.goTo(EDIT_POKEDEX_SLOT_COMMAND_NAME, {
            region_id,
            pokedex_no,
          });
        } else {
          const pokemonName: string = messageArgs.slice(1).join(' ');

          await handleAddPokemonToSlot(
            ctx,
            region_id,
            pokedex_no.toString(),
            pokemonName
          );

          ctx.state.set(
            'prompt',
            'Pokémon added to slot! You can enter another Pokédex number to edit another slot, or type "exit" to go back to the main menu.'
          );
        }
      })
      .setReturnable()
      .setTrackedInHistory()
      .build();
  },
};
