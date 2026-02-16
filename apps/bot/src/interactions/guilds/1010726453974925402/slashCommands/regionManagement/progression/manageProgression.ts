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
  AdminMenu<ManageProgressionCommandOptions>,
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
    if (!options?.regionId) {
      throw new Error(
        'Region ID is required to manage progression definitions.'
      );
    }
    const { regionId } = options;
    const region = await Region.findById(regionId);
    if (!region) {
      throw new Error('Region not found.');
    }

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setButtons((menu) => getManageProgressionButtons(menu, region))
      .setEmbeds((menu) => getManageProgressionMenuEmbeds(menu, region))
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build();
  },
};

const getManageProgressionButtons = async (
  _menu: AdminMenu<ManageProgressionCommandOptions>,
  region: Region
): Promise<MenuButtonConfig<AdminMenu<ManageProgressionCommandOptions>>[]> => {
  const progressionDefinitions = Array.from(
    region.progressionDefinitions.entries()
  );
  return [
    {
      label: 'Add',
      style: ButtonStyle.Success,
      fixedPosition: 'start',
      onClick: async (menu) =>
        MenuWorkflow.openMenu(menu, ADD_PROGRESSION_DEFINITION_COMMAND_NAME, {
          regionId: region.id,
        }),
    },
    ...progressionDefinitions.map(([key, definition]) => ({
      id: key,
      label: `${definition.name}`,
      style: ButtonStyle.Primary,
      onClick: async (menu: AdminMenu<ManageProgressionCommandOptions>) =>
        MenuWorkflow.openMenu(menu, EDIT_PROGRESSION_DEFINITION_COMMAND_NAME, {
          regionId: region.id,
          progressionKey: key,
        }),
    })),
  ];
};
