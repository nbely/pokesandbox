import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';
import { z } from 'zod';

import { saveRegion } from '@bot/cache';
import { AdminMenuBuilderV2, type AdminMenuContext } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import {
  handleRegionAndLocationAutocomplete,
  onlyAdminRoles,
  parseCommandOptions,
} from '@bot/utils';
import type { ButtonInputConfig } from '@flowcord/v2';

import { LOCATION_EDIT_MODAL_ID, getLocationEditModal } from './location.modal';
import { getLocationMenuEmbeds } from './location.embeds';
import type { LocationMenuState } from './types';

const COMMAND_NAME = 'location';
export const LOCATION_COMMAND_NAME = COMMAND_NAME;

const locationCommandOptionsSchema = z.object({
  region_id: z.string().min(1),
  location_id: z.string().min(1),
});

export const LocationCommand: ISlashCommand = {
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
  createMenuV2: (session, options) => {
    const { region_id, location_id } = parseCommandOptions(
      locationCommandOptionsSchema,
      options
    );

    return new AdminMenuBuilderV2<LocationMenuState>(
      session,
      COMMAND_NAME,
      options
    )
      .setEmbeds((ctx) => getLocationMenuEmbeds(ctx, region_id, location_id))
      .setButtons((ctx) => getLocationButtons(ctx, region_id, location_id))
      .setModal((ctx) => getLocationEditModal(ctx, region_id, location_id))
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build();
  },
};

const getLocationButtons = async (
  ctx: AdminMenuContext<LocationMenuState>,
  regionId: string,
  locationId: string
): Promise<ButtonInputConfig<AdminMenuContext<LocationMenuState>>[]> => {
  return [
    {
      label: 'Edit',
      style: ButtonStyle.Success,
      fixedPosition: 'start',
      opensModal: LOCATION_EDIT_MODAL_ID,
    },
    {
      label: 'Delete',
      style: ButtonStyle.Danger,
      action: async (ctx) => {
        const region = await ctx.admin.getRegion(regionId);

        // Remove location from region
        region.locations = region.locations.filter(
          (id) => id.toString() !== locationId
        );
        await saveRegion(region);

        // Delete the location document
        const location = await ctx.admin.getLocation(locationId);
        await location.deleteOne();

        ctx.goBack();
      },
    },
    {
      label: 'Connections',
      style: ButtonStyle.Primary,
      action: async (ctx) => {
        ctx.state.set('prompt', 'Connections management is coming soon!');
      },
    },
    {
      label: 'Entry Rules',
      style: ButtonStyle.Primary,
      action: async (ctx) => {
        ctx.state.set('prompt', 'Entry rules management is coming soon!');
      },
    },
    {
      label: 'Trainers',
      style: ButtonStyle.Primary,
      action: async (ctx) => {
        ctx.state.set('prompt', 'Trainer management is coming soon!');
      },
    },
    {
      label: 'Wild Pokémon',
      style: ButtonStyle.Primary,
      action: async (ctx) => {
        ctx.state.set('prompt', 'Wild Pokémon management is coming soon!');
      },
    },
  ];
};
