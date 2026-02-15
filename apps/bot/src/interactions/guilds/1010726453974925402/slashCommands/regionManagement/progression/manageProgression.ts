import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import {
  AdminMenu,
  AdminMenuBuilder,
  MenuButtonConfig,
  MenuWorkflow,
} from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';
import { Region } from '@shared/models';

import { ADD_PROGRESSION_DEFINITION_COMMAND_NAME } from './addProgressionDefinition';
import { EDIT_PROGRESSION_DEFINITION_COMMAND_NAME } from './editProgressionDefinition';
import { getManageProgressionMenuEmbeds } from './progression.embeds';

const COMMAND_NAME = 'manage-progression';
export const MANAGE_PROGRESSION_COMMAND_NAME = COMMAND_NAME;

type ManageProgressionCommandOptions = {
  regionId: string;
};
type ManageProgressionCommand = ISlashCommand<
  AdminMenu,
  ManageProgressionCommandOptions
>;

export const ManageProgressionCommand: ManageProgressionCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription(
      'Manage progression definitions for one of your PokéSandbox Regions'
    )
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, options) => {
    const { regionId } = options;
    const region = await Region.findById(regionId);

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setButtons((menu) => getManageProgressionButtons(menu, regionId))
      .setEmbeds((menu) => getManageProgressionMenuEmbeds(menu, regionId))
      .setCancellable()
      .setListPagination({
        quantityItemsPerPage: 10,
        nextButton: { style: ButtonStyle.Primary },
        previousButton: { style: ButtonStyle.Primary },
        getTotalQuantityItems: async () => {
          const region = await Region.findById(regionId);
          return region.progressionDefinitions.size;
        },
      })
      .setMessageHandler(async (menu, response) => {
        const progressionKey = response.trim();
        const region = await Region.findById(regionId);

        if (region.progressionDefinitions.has(progressionKey)) {
          await MenuWorkflow.openMenu(
            menu,
            EDIT_PROGRESSION_DEFINITION_COMMAND_NAME,
            {
              regionId,
              progressionKey,
            }
          );
        } else {
          menu.prompt = `Progression "${progressionKey}" not found. Please enter a valid progression key or use the Add button.`;
          await menu.refresh();
        }
      })
      .setReturnable()
      .setTrackedInHistory()
      .build();
  },
};

const getManageProgressionButtons = async (
  _menu: AdminMenu,
  regionId: string
): Promise<MenuButtonConfig<AdminMenu>[]> => {
  return [
    {
      label: 'Add',
      style: ButtonStyle.Success,
      onClick: async (menu) =>
        MenuWorkflow.openMenu(menu, ADD_PROGRESSION_DEFINITION_COMMAND_NAME, {
          regionId,
        }),
    },
  ];
};
