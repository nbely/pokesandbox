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
import { assertOptions, onlyAdminRoles } from '@bot/utils';

import { progressionsMenuEmbeds } from './progression.embeds';
import { PROGRESSION_CREATE_NAME_COMMAND_NAME } from './progressionCreateName';
import { PROGRESSION_EDIT_COMMAND_NAME } from './progressionEdit';

const COMMAND_NAME = 'progressions';
export const PROGRESSIONS_COMMAND_NAME = COMMAND_NAME;

type ProgressionsCommandOptions = {
  region_id: string;
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
    assertOptions(options);
    const { region_id } = options;

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setButtons((menu) => getManageProgressionButtons(menu, region_id))
      .setEmbeds((menu) => progressionsMenuEmbeds(menu, region_id))
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build();
  },
};

const getManageProgressionButtons = async (
  menu: AdminMenu<ProgressionsCommandOptions>,
  regionId: string
): Promise<MenuButtonConfig<AdminMenu<ProgressionsCommandOptions>>[]> => {
  const region = await menu.getRegion(regionId);
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
          region_id: regionId,
        }),
    },
    ...progressionDefinitions.map(([progressionKey, definition]) => ({
      id: progressionKey,
      label: `${definition.name}`,
      style: ButtonStyle.Primary,
      onClick: async (menu: AdminMenu<ProgressionsCommandOptions>) =>
        MenuWorkflow.openMenu(menu, PROGRESSION_EDIT_COMMAND_NAME, {
          region_id: regionId,
          progression_key: progressionKey,
        }),
    })),
  ];
};
