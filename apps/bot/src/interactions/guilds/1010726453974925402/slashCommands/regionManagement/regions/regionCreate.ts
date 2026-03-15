import { InteractionContextType, SlashCommandBuilder } from 'discord.js';

import { saveServer } from '@bot/cache';
import { AdminMenuBuilderV2, type AdminMenuContext } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';
import { Region } from '@shared/models';

import { REGIONS_COMMAND_NAME } from './regions';
import {
  getCreateFirstRegionEmbeds,
  getRegionsMenuEmbeds,
} from './regions.embeds';

const COMMAND_NAME = 'region-create';
export const REGION_CREATE_COMMAND_NAME = COMMAND_NAME;

type RegionCreateMenuState = {
  prompt?: string;
};

export const RegionCreateCommand: ISlashCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Create a new Region for your PokéSandbox server')
    .setContexts(InteractionContextType.Guild),
  createMenuV2: (session) =>
    new AdminMenuBuilderV2<RegionCreateMenuState>(session, COMMAND_NAME)
      .setEmbeds(async (ctx) => {
        const regions = await ctx.admin.getRegions();

        return regions.length === 0
          ? getCreateFirstRegionEmbeds(ctx)
          : getRegionsMenuEmbeds(
              ctx,
              'Please enter a name for your new Region.'
            );
      })
      .setMessageHandler(
        async (
          ctx: AdminMenuContext<RegionCreateMenuState>,
          response: string
        ): Promise<void> => {
          const server = await ctx.admin.getServer();

          const region: Region = await Region.create({
            baseGeneration: 10,
            charactersPerPlayer: 1,
            characterList: [],
            currencyType: 'P',
            deployable: false,
            deployed: false,
            graphicSettings: {
              backSpritesEnabled: false,
              frontSpritesEnabled: false,
              iconSpritesEnabled: false,
            },
            locations: [],
            name: response,
            pokedex: [],
            progressionDefinitions: new Map(),
            quests: {
              active: [],
              passive: [],
            },
            shops: [],
            transportationTypes: [],
          });

          server.regions.push(region._id);
          await saveServer(server);

          ctx.state.set(
            'prompt',
            `Successfully created the new region: \`${region.name}\``
          );
          await ctx.goBack();
        }
      )
      .setFallbackMenu(REGIONS_COMMAND_NAME)
      .setTrackedInHistory()
      .build(),
};
