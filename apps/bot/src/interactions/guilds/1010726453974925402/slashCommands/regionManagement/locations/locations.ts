import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';
import { z } from 'zod';

import { AdminMenuBuilder, type AdminMenuContext } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import {
  handleRegionAutocomplete,
  onlyAdminRoles,
  parseCommandOptions,
  sortByOrdinal,
} from '@bot/utils';
import type { ButtonInputConfig } from '@flowcord';

import { LOCATION_COMMAND_NAME } from './location';
import {
  LOCATION_CREATE_MODAL_ID,
  getLocationCreateModal,
} from './location.modal';
import { getLocationsMenuEmbeds } from './locations.embeds';
import type { LocationsMenuState } from './types';

const COMMAND_NAME = 'locations';
export const LOCATIONS_COMMAND_NAME = COMMAND_NAME;

const locationsCommandOptionsSchema = z.object({
  region_id: z.string().min(1),
});

export const LocationsCommand: ISlashCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Manage locations for one of your PokéSandbox Regions')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) => {
      return option
        .setName('region_id')
        .setDescription('The ID of the region to manage')
        .setRequired(true)
        .setAutocomplete(true);
    }),
  autocomplete: handleRegionAutocomplete,
  createMenu: (session, options) => {
    const { region_id } = parseCommandOptions(
      locationsCommandOptionsSchema,
      options
    );

    return new AdminMenuBuilder<LocationsMenuState>(
      session,
      COMMAND_NAME,
      options
    )
      .setButtons((ctx) => getLocationsButtons(ctx, region_id))
      .setEmbeds((ctx) => getLocationsMenuEmbeds(ctx, region_id))
      .setModal((ctx) => getLocationCreateModal(ctx, region_id))
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build();
  },
};

const getLocationsButtons = async (
  ctx: AdminMenuContext<LocationsMenuState>,
  regionId: string
): Promise<ButtonInputConfig<AdminMenuContext<LocationsMenuState>>[]> => {
  const locations = await ctx.admin.getLocations(regionId);
  const sortedLocations = sortByOrdinal(locations);

  return [
    {
      label: 'Add',
      fixedPosition: 'start',
      style: ButtonStyle.Success,
      opensModal: LOCATION_CREATE_MODAL_ID,
    },
    ...sortedLocations.map((location) => ({
      label: `${location.ordinal}`,
      id: location._id.toString(),
      style: ButtonStyle.Primary,
      action: async (ctx: AdminMenuContext<LocationsMenuState>) =>
        ctx.goTo(LOCATION_COMMAND_NAME, {
          region_id: regionId,
          location_id: location._id.toString(),
        }),
    })),
  ];
};
