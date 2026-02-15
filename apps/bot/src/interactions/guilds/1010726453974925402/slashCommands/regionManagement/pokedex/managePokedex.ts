import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { AdminMenu, AdminMenuBuilder, MenuWorkflow } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';

import { EDIT_POKEDEX_SLOT_COMMAND_NAME } from './editPokedexSlot';
import { getManagePokedexMenuEmbeds } from './pokedex.embeds';
import { Region } from '@shared/models';

const COMMAND_NAME = 'manage-pokedex';
export const MANAGE_POKEDEX_COMMAND_NAME = COMMAND_NAME;

type ManagePokedexCommandOptions = {
  regionId: string;
};
type ManagePokedexCommand = ISlashCommand<
  AdminMenu<any>,
  ManagePokedexCommandOptions
>;

export const ManagePokedexCommand: ManagePokedexCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Manage the Pokédex for one of your PokéSandbox Regions')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, options) => {
    if (!options) {
      throw new Error('Options are required');
    }
    const { regionId } = options;
    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setEmbeds((menu) => getManagePokedexMenuEmbeds(menu as any, regionId))
      .setCancellable()
      .setListPagination({
        quantityItemsPerPage: 50,
        nextButton: { style: ButtonStyle.Primary },
        previousButton: { style: ButtonStyle.Primary },
        getTotalQuantityItems: async () => {
          const region = await Region.findById(regionId);
          if (!region) {
            throw new Error('Region not found');
          }
          return region.pokedex.length;
        },
      })
      .setMessageHandler(async (menu, response) => {
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
          await MenuWorkflow.openMenu(menu as any, EDIT_POKEDEX_SLOT_COMMAND_NAME, {
            regionId,
            pokedexNo: pokedexNumber,
          });
        } else {
          const pokemonName: string = messageArgs.slice(1).join(' ');

          await MenuWorkflow.openMenu(menu as any, 'search-pokemon', {
            regionId,
            pokemonName,
          });
        }
      })
      .setReturnable()
      .setTrackedInHistory()
      .build();
  },
} as ISlashCommand<any, ManagePokedexCommandOptions>;
