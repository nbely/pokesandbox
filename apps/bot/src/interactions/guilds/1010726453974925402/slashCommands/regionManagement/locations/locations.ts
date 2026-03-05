import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import {
  AdminMenu,
  AdminMenuBuilder,
  MenuButtonConfig,
} from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import {
  assertOptions,
  handleRegionAutocomplete,
  onlyAdminRoles,
} from '@bot/utils';

import { getLocationsMenuEmbeds } from './locations.embeds';
import type { LocationsCommandOptions } from './types';

const COMMAND_NAME = 'locations';
export const LOCATIONS_COMMAND_NAME = COMMAND_NAME;

type LocationsCommand = ISlashCommand<
  AdminMenu<LocationsCommandOptions>,
  LocationsCommandOptions
>;

export const LocationsCommand: LocationsCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription(
      'Manage locations for one of your PokéSandbox Regions'
    )
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) => {
      return option
        .setName('region_id')
        .setDescription('The ID of the region to manage')
        .setRequired(true)
        .setAutocomplete(true);
    }),
  autocomplete: handleRegionAutocomplete,
  createMenu: async (session, options) => {
    assertOptions(options);
    const { region_id } = options;

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setButtons((menu) => getLocationsButtons(menu, region_id))
      .setEmbeds((menu) => getLocationsMenuEmbeds(menu, region_id))
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build();
  },
};

const getLocationsButtons = async (
  menu: AdminMenu<LocationsCommandOptions>,
  regionId: string
): Promise<MenuButtonConfig<AdminMenu<LocationsCommandOptions>>[]> => {
  const locations = await menu.getLocations(regionId);

  return [
    {
      label: 'Add Location',
      fixedPosition: 'start',
      style: ButtonStyle.Success,
      onClick: async (menu) => {
        menu.prompt = 'The create location feature is coming soon!';
        await menu.refresh();
      },
    },
    ...locations.map((location, index) => ({
      label: `${index + 1}`,
      id: location._id.toString(),
      style: ButtonStyle.Primary,
      onClick: async (menu: AdminMenu<LocationsCommandOptions>) => {
        menu.prompt = 'The location configuration feature is coming soon!';
        await menu.refresh();
      },
    })),
  ];
};
