import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { saveRegion } from '@bot/cache';
import { AdminMenu, AdminMenuBuilder, MenuButtonConfig } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import {
  assertOptions,
  handleRegionAndLocationAutocomplete,
  onlyAdminRoles,
} from '@bot/utils';

import { getLocationModal } from './location.modal';
import { getLocationMenuEmbeds } from './location.embeds';
import type { LocationCommandOptions } from './types';

const COMMAND_NAME = 'location';
export const LOCATION_COMMAND_NAME = COMMAND_NAME;

type LocationCommand = ISlashCommand<
  AdminMenu<LocationCommandOptions>,
  LocationCommandOptions
>;

export const LocationCommand: LocationCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription(
      'Manage a single location in one of your PokéSandbox Regions'
    )
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('region_id')
        .setDescription('The ID of the region containing the location')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('location_id')
        .setDescription('The ID of the location to manage')
        .setRequired(true)
        .setAutocomplete(true)
    ),
  autocomplete: handleRegionAndLocationAutocomplete,
  createMenu: async (session, options) => {
    assertOptions(options);
    const { region_id, location_id } = options;

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setEmbeds((menu) => getLocationMenuEmbeds(menu, region_id, location_id))
      .setButtons((menu) => getLocationButtons(menu, region_id, location_id))
      .setModal((menu) => getLocationModal(menu, region_id, location_id))
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build();
  },
};

const getLocationButtons = async (
  menu: AdminMenu<LocationCommandOptions>,
  regionId: string,
  locationId: string
): Promise<MenuButtonConfig<AdminMenu<LocationCommandOptions>>[]> => {
  return [
    {
      label: 'Edit',
      style: ButtonStyle.Success,
      fixedPosition: 'start',
      onClick: async (menu) => {
        await menu.openModal();
      },
    },
    {
      label: 'Delete',
      style: ButtonStyle.Danger,
      onClick: async (menu) => {
        const region = await menu.getRegion(regionId);

        // Remove location from region
        region.locations = region.locations.filter(
          (id) => id.toString() !== locationId
        );
        await saveRegion(region);

        // Delete the location document
        const location = await menu.getLocation(locationId);
        await location.deleteOne();

        // Navigate back, falling back to the locations list if there's no prior history
        await menu.session
          .goBack
          // async () =>
          // MenuWorkflow.openMenu(menu, LOCATIONS_COMMAND_NAME, {
          //   region_id: regionId,
          // })
          ();
      },
    },
    {
      label: 'Connections',
      style: ButtonStyle.Primary,
      onClick: async (menu) => {
        menu.prompt = 'Connections management is coming soon!';
        await menu.refresh();
      },
    },
    {
      label: 'Entry Rules',
      style: ButtonStyle.Primary,
      onClick: async (menu) => {
        menu.prompt = 'Entry rules management is coming soon!';
        await menu.refresh();
      },
    },
    {
      label: 'Trainers',
      style: ButtonStyle.Primary,
      onClick: async (menu) => {
        menu.prompt = 'Trainer management is coming soon!';
        await menu.refresh();
      },
    },
    {
      label: 'Wild Pokémon',
      style: ButtonStyle.Primary,
      onClick: async (menu) => {
        menu.prompt = 'Wild Pokémon management is coming soon!';
        await menu.refresh();
      },
    },
  ];
};
