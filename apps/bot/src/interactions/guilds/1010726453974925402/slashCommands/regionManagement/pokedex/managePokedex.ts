import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { AdminMenu, AdminMenuBuilder, MenuWorkflow } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import {
  assertOptions,
  handleRegionAutocomplete,
  onlyAdminRoles,
} from '@bot/utils';

import { EDIT_POKEDEX_SLOT_COMMAND_NAME } from './editPokedexSlot';
import { getManagePokedexMenuEmbeds } from './pokedex.embeds';

const COMMAND_NAME = 'manage-pokedex';
export const MANAGE_POKEDEX_COMMAND_NAME = COMMAND_NAME;

type ManagePokedexCommandOptions = {
  region_id: string;
};
type ManagePokedexCommand = ISlashCommand<
  AdminMenu<ManagePokedexCommandOptions>,
  ManagePokedexCommandOptions
>;

export const ManagePokedexCommand: ManagePokedexCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  autocomplete: async (_client, interaction) => {
    await handleRegionAutocomplete(interaction);
  },
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
  createMenu: async (session, options) => {
    assertOptions(options);
    const { region_id } = options;

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setEmbeds((menu) => getManagePokedexMenuEmbeds(menu, region_id))
      .setCancellable()
      .setListPagination({
        quantityItemsPerPage: 50,
        nextButton: { style: ButtonStyle.Primary },
        previousButton: { style: ButtonStyle.Primary },
        getTotalQuantityItems: async (menu) => {
          const region = await menu.getRegion(region_id);
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
          await MenuWorkflow.openMenu(menu, EDIT_POKEDEX_SLOT_COMMAND_NAME, {
            region_id,
            pokedex_no: pokedexNumber,
          });
        } else {
          const pokemonName: string = messageArgs.slice(1).join(' ');

          await MenuWorkflow.openMenu(menu, 'search-pokemon', {
            region_id,
            pokemonName,
          });
        }
      })
      .setReturnable()
      .setTrackedInHistory()
      .build();
  },
};
