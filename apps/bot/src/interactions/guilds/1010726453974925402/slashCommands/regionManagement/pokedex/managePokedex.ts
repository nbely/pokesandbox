import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { AdminMenu, AdminMenuBuilder, MenuWorkflow } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';
import { findRegion } from '@shared';

import { ADD_POKEDEX_SLOT_COMMAND_NAME } from './addPokedexSlot';
import { getManagePokedexMenuEmbeds } from './pokedex.embeds';

const COMMAND_NAME = 'manage-pokedex';
export const MANAGE_POKEDEX_COMMAND_NAME = COMMAND_NAME;

export const ManagePokedexCommand: ISlashCommand<AdminMenu> = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Manage the Pokédex for one of your PokéSandbox Regions')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, regionId) =>
    new AdminMenuBuilder(session, COMMAND_NAME)
      .setEmbeds((menu) => getManagePokedexMenuEmbeds(menu, regionId))
      .setCancellable()
      .setListPagination({
        quantityItemsPerPage: 50,
        nextButton: { style: ButtonStyle.Primary },
        previousButton: { style: ButtonStyle.Primary },
        getTotalQuantityItems: async () => {
          const region = await findRegion({ _id: regionId });
          return region.pokedex.length;
        },
      })
      .setMessageHandler(async (menu, response) => {
        const region = await findRegion({ _id: regionId });
        const messageArgs: string[] = response.split(' ');
        const pokedexNumber: number = +messageArgs[0];

        if (
          Number.isNaN(pokedexNumber) ||
          pokedexNumber < 1 ||
          pokedexNumber > 1500
        ) {
          menu.session.handleError(
            new Error('Please enter a valid Pokédex number')
          );
        } else if (messageArgs.length < 2) {
          if (region.pokedex[pokedexNumber - 1] == null) {
            await MenuWorkflow.openMenu(
              menu,
              ADD_POKEDEX_SLOT_COMMAND_NAME,
              regionId,
              pokedexNumber.toString()
            );
          } else {
            await MenuWorkflow.openMenu(
              menu,
              'edit-pokedex-slot',
              regionId,
              pokedexNumber.toString()
            );
          }
        } else {
          // TODO: handle search by pokemon name
          const pokemonName: string = messageArgs.slice(1).join(' ');
          await MenuWorkflow.openMenu(
            menu,
            'search-pokemon',
            regionId,
            pokemonName
          );
        }
      })
      .setReturnable()
      .setTrackedInHistory()
      .build(),
};
