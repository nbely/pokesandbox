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
  handleRegionAutocomplete,
  onlyAdminRoles,
  parseCommandOptions,
} from '@bot/utils';
import type { ButtonInputConfig } from '@flowcord/v2';

import { MANAGE_POKEDEX_COMMAND_NAME } from '../pokedex/managePokedex';
import { PROGRESSIONS_COMMAND_NAME } from '../progression/progressions';
import { LOCATIONS_COMMAND_NAME } from '../locations/locations';
import { getRegionMenuEmbeds } from './region.embeds';
import type { RegionMenuState } from './types';

const COMMAND_NAME = 'region';
export const REGION_COMMAND_NAME = COMMAND_NAME;

const regionCommandOptionsSchema = z.object({
  region_id: z.string().min(1),
});

export const RegionCommand: ISlashCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Manage a Region for your PokéSandbox server')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) => {
      return option
        .setName('region_id')
        .setDescription('The ID of the region to manage')
        .setRequired(true)
        .setAutocomplete(true);
    }),
  autocomplete: handleRegionAutocomplete,
  createMenuV2: (session, options) => {
    const { region_id } = parseCommandOptions(
      regionCommandOptionsSchema,
      options
    );

    return new AdminMenuBuilderV2<RegionMenuState>(
      session,
      COMMAND_NAME,
      options
    )
      .setButtons((ctx) => getRegionButtons(ctx, region_id))
      .setEmbeds((ctx) => getRegionMenuEmbeds(ctx, region_id))
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build();
  },
};

const getRegionButtons = async (
  ctx: AdminMenuContext<RegionMenuState>,
  regionId: string
): Promise<ButtonInputConfig<AdminMenuContext<RegionMenuState>>[]> => {
  const region = await ctx.admin.getRegion(regionId);

  const subMenuButtons: { id: string; command: string }[] = [
    { id: 'Pokedex', command: MANAGE_POKEDEX_COMMAND_NAME },
    { id: 'Moves', command: 'moves' },
    { id: 'Progression', command: PROGRESSIONS_COMMAND_NAME },
    { id: 'Locations', command: LOCATIONS_COMMAND_NAME },
    { id: 'Transportation', command: 'transportation' },
    { id: 'Quests', command: 'quests' },
    { id: 'Shops', command: 'shops' },
    { id: 'Mechanics', command: 'mechanics' },
    { id: 'Graphics', command: 'graphics' },
  ];

  return [
    {
      label: region.deployed ? 'Undeploy' : 'Deploy',
      disabled: !region.deployable,
      fixedPosition: 'start',
      style: region.deployed ? ButtonStyle.Danger : ButtonStyle.Success,
      action: async (ctx) => {
        const region = await ctx.admin.getRegion(regionId);
        region.deployed = !region.deployed;
        await saveRegion(region);
        ctx.state.set(
          'prompt',
          `Successfully ${region.deployed ? 'deployed' : 'undeployed'} the ${
            region.name
          } Region`
        );
      },
    },
    ...subMenuButtons.map(({ id, command }, idx) => ({
      label: `${idx + 1}`,
      style: ButtonStyle.Primary,
      action: async (ctx: AdminMenuContext<RegionMenuState>) =>
        ctx.goTo(command, { region_id: regionId }),
      id,
    })),
  ];
};
