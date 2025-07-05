import { InteractionContextType, SlashCommandBuilder } from 'discord.js';

import { AdminMenu, AdminMenuBuilder, MenuWorkflow } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles, searchPokemon } from '@bot/utils';
import { findRegion, upsertRegion, DexEntry, Region } from '@shared';

import { EDIT_POKEDEX_SLOT_COMMAND_NAME } from './editPokedexSlot';
import { getAddPokedexSlotEmbeds } from './pokedex.embeds';
import { SELECT_MATCHED_POKEMON_COMMAND_NAME } from './selectMatchedPokemon';

const COMMAND_NAME = 'add-pokedex-slot';
export const ADD_POKEDEX_SLOT_COMMAND_NAME = COMMAND_NAME;

export const AddPokedexSlotCommand: ISlashCommand<AdminMenu> = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Add a Pokémon to a regional Pokédex slot')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, regionId, pokedexNo) =>
    new AdminMenuBuilder(session, COMMAND_NAME)
      .setEmbeds((menu) => getAddPokedexSlotEmbeds(menu, regionId, pokedexNo))
      .setCancellable()
      .setMessageHandler(async (menu, pokemonName) => {
        const server = await menu.fetchServer();
        const region = await findRegion({ _id: regionId });

        const { exactMatch, potentialMatches } = await searchPokemon(
          server._id.toString(),
          pokemonName
        );

        if (!exactMatch && !potentialMatches.length) {
          menu.prompt = `No Pokémon found with the name "${pokemonName}". Please try again.`;
          return menu.refresh();
        } else if (!exactMatch && !!potentialMatches.length) {
          return MenuWorkflow.openSubMenuWithContinuation(
            menu,
            SELECT_MATCHED_POKEMON_COMMAND_NAME,
            [
              regionId,
              ...potentialMatches.map((match) => match._id.toString()),
            ],
            async (_session, selectedPokemonId: string) => {
              // Handle the selected Pokemon ID
              const selectedPokemon = potentialMatches.find(
                (match) => match._id.toString() === selectedPokemonId
              );

              if (!selectedPokemon) {
                menu.prompt = `Selected Pokémon not found. Please try again.`;
                return menu.refresh();
              }

              // Continue with your logic...
              await continueWithSelectedPokemon(
                menu,
                selectedPokemon,
                region,
                pokedexNo
              );
            }
          );
        } else {
          // Handle exact match (original logic)
          await continueWithSelectedPokemon(
            menu,
            exactMatch,
            region,
            pokedexNo
          );
        }
      })
      .setReturnable()
      .setTrackedInHistory()
      .build(),
};

const continueWithSelectedPokemon = async (
  menu: AdminMenu,
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
    await upsertRegion({ _id: region._id }, region);

    return MenuWorkflow.openMenu(
      menu,
      EDIT_POKEDEX_SLOT_COMMAND_NAME,
      region._id.toString(),
      pokedexNo
    );
  }
};
