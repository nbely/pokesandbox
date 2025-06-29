import { InteractionContextType, SlashCommandBuilder } from 'discord.js';

import { AdminMenu, AdminMenuBuilder } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles, openMenu } from '@bot/utils';
import { getAddPokedexSlotEmbeds } from './pokedex.embeds';

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
      .setMessageHandler(
        async (menu, pokemonName) =>
          openMenu(menu, 'search-pokemon', regionId, pokemonName)
        //   if (menu.region.pokedex[pokedexNo - 1]) {
        //     menu.back();
        //   }
      )
      .setReturnable()
      .setTrackedInHistory()
      .build(),
};
