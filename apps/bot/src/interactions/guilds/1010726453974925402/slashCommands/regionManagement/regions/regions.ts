import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { AdminMenuBuilderV2, type AdminMenuContext } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';
import type { ButtonInputConfig } from '@flowcord/v2';

import { REGION_COMMAND_NAME } from '../region/region';
import { REGION_CREATE_COMMAND_NAME } from './regionCreate';
import { getRegionsMenuEmbeds } from './regions.embeds';

const COMMAND_NAME = 'regions';
export const REGIONS_COMMAND_NAME = COMMAND_NAME;

type RegionsMenuState = {
  prompt?: string;
};

export const RegionsCommand: ISlashCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Manage Regions for your PokéSandbox server')
    .setContexts(InteractionContextType.Guild),
  createMenuV2: (session) =>
    new AdminMenuBuilderV2<RegionsMenuState>(session, COMMAND_NAME)
      .setButtons(getRegionsButtons)
      .setEmbeds(getRegionsMenuEmbeds)
      .setCancellable()
      .setTrackedInHistory()
      .build(),
};

const getRegionsButtons = async (
  ctx: AdminMenuContext<RegionsMenuState>
): Promise<ButtonInputConfig<AdminMenuContext<RegionsMenuState>>[]> => {
  const regions = await ctx.admin.getRegions();

  return [
    {
      label: 'Create Region',
      fixedPosition: 'start',
      style: ButtonStyle.Success,
      action: async (ctx) => ctx.goTo(REGION_CREATE_COMMAND_NAME),
    },
    ...regions.map((region) => ({
      label: region.name,
      id: region._id.toString(),
      style: ButtonStyle.Primary,
      action: async (ctx: AdminMenuContext<RegionsMenuState>) =>
        ctx.goTo(REGION_COMMAND_NAME, {
          region_id: region._id.toString(),
        }),
    })),
  ];
};
