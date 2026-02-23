import { InteractionContextType, SlashCommandBuilder } from 'discord.js';

import { saveServer } from '@bot/cache';
import { type AdminMenu, AdminMenuBuilder, MenuWorkflow } from '@bot/classes';
import { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';
import { Region } from '@shared/models';

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
        const regions = await menu.getRegions();

        return regions.length === 0
          ? getCreateFirstRegionEmbeds(menu)
          : getRegionsMenuEmbeds(
              menu,
              'Please enter a name for your new Region.'
            );
      })
      .setMessageHandler(
        async (menu: AdminMenu, response: string): Promise<void> => {
          const server = await menu.getServer();

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
            playerList: [],
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

          menu.prompt = `Successfully created the new region: \`${region.name}\``;
          await menu.session.goBack(async () =>
            MenuWorkflow.openMenu(menu, 'regions')
          );
        }
      )
      .setTrackedInHistory()
      .build(),
};
