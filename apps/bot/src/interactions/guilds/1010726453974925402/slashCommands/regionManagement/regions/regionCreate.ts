import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { Types } from 'mongoose';

import { AdminMenuBuilder, type AdminMenu } from '@bot/classes';
import { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';
import type { Region } from '@shared/models';
import { createRegion, upsertServer } from '@shared/services';

import {
  getCreateFirstRegionEmbeds,
  getRegionsMenuEmbeds,
} from './regions.embeds';

const COMMAND_NAME = 'region-create';
export const REGION_CREATE_COMMAND_NAME = COMMAND_NAME;

export const RegionCreateCommand: ISlashCommand<AdminMenu> = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Create a new Region for your PokéSandbox server')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session) =>
    new AdminMenuBuilder(session, COMMAND_NAME)
      .setEmbeds(async (menu) => {
        const { regions } = await menu.fetchServerAndRegions();

        return regions.length === 0
          ? getCreateFirstRegionEmbeds(menu)
          : getRegionsMenuEmbeds(
              menu,
              'Please enter a name for your new Region.'
            );
      })
      .setMessageHandler(
        async (menu: AdminMenu, response: string): Promise<void> => {
          const server = await menu.fetchServer();

          const region: Region = await createRegion({
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
            playerList: [],
            pokedex: [],
            progressionTypes: {},
            quests: {
              active: [],
              passive: [],
            },
            shops: [],
            transportationTypes: [],
          });

          server.regions.push(new Types.ObjectId(region._id));
          await upsertServer({ serverId: server.serverId }, server);

          menu.prompt = `Successfully created the new region: \`${region.name}\``;
          await menu.session.goBack();
        }
      )
      .setTrackedInHistory()
      .build(),
};
