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

import { progressionsMenuEmbeds } from './progression.embeds';
import { PROGRESSION_CREATE_NAME_COMMAND_NAME } from './progressionCreateName';
import { PROGRESSION_EDIT_COMMAND_NAME } from './progressionEdit';

const COMMAND_NAME = 'progressions';
export const PROGRESSIONS_COMMAND_NAME = COMMAND_NAME;

type ProgressionsCommandOptions = {
  regionId: string;
};
type ProgressionsCommand = ISlashCommand<
  AdminMenu<ProgressionsCommandOptions>,
  ProgressionsCommandOptions
>;

export const ProgressionsCommand: ProgressionsCommand = {
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
      .setEmbeds((menu) => progressionsMenuEmbeds(menu, region))
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build();
  },
};

const getManageProgressionButtons = async (
  _menu: AdminMenu<ProgressionsCommandOptions>,
  region: Region
): Promise<MenuButtonConfig<AdminMenu<ProgressionsCommandOptions>>[]> => {
  const progressionDefinitions = Array.from(
    region.progressionDefinitions.entries()
  );
  return [
    {
      label: 'Add',
      style: ButtonStyle.Success,
      fixedPosition: 'start',
      onClick: async (menu) =>
        MenuWorkflow.openMenu(menu, PROGRESSION_CREATE_NAME_COMMAND_NAME, {
          regionId: region.id,
        }),
    },
    ...progressionDefinitions.map(([key, definition]) => ({
      id: key,
      label: `${definition.name}`,
      style: ButtonStyle.Primary,
      onClick: async (menu: AdminMenu<ProgressionsCommandOptions>) =>
        MenuWorkflow.openMenu(menu, PROGRESSION_EDIT_COMMAND_NAME, {
          regionId: region.id,
          progressionKey: key,
        }),
    })),
  ];
};
