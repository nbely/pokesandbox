import { InteractionContextType, SlashCommandBuilder } from 'discord.js';

import { AdminMenu, AdminMenuBuilder } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles, openMenu, searchPokemon } from '@bot/utils';
import { getAddPokedexSlotEmbeds } from './pokedex.embeds';
import { findRegion, upsertRegion } from '@shared';
import { EDIT_POKEDEX_SLOT_COMMAND_NAME } from './editPokedexSlot';
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
          console.log('checking commands', menu.client.slashCommands.entries());
          return openMenu(
            menu,
            SELECT_MATCHED_POKEMON_COMMAND_NAME,
            regionId,
            ...potentialMatches.map((match) => match._id.toString())
          );
        } else {
          if (region.pokedex.some((pkmn) => pkmn?.id.equals(exactMatch._id))) {
            menu.prompt = `The Pokémon "${exactMatch.name}" is already in the Pokédex. Please choose a different Pokémon.`;
            return menu.refresh();
          } else {
            region.pokedex[+pokedexNo - 1] = {
              id: exactMatch._id,
              name: exactMatch.name,
            };
            await upsertRegion({ _id: regionId }, region);
            return openMenu(
              menu,
              EDIT_POKEDEX_SLOT_COMMAND_NAME,
              regionId,
              pokedexNo
            );
          }
        }
      })
      .setReturnable()
      .setTrackedInHistory()
      .build(),
};
