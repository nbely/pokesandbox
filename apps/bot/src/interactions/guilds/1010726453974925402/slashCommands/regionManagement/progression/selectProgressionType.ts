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

import { CONFIGURE_PROGRESSION_METADATA_COMMAND_NAME } from './configureProgressionMetadata';
import { getSelectProgressionTypeEmbeds } from './progression.embeds';

const COMMAND_NAME = 'select-progression-type';
export const SELECT_PROGRESSION_TYPE_COMMAND_NAME = COMMAND_NAME;

type SelectProgressionTypeCommandOptions = {
  regionId: string;
  progressionKey: string;
};
type SelectProgressionTypeCommand = ISlashCommand<
  AdminMenu,
  SelectProgressionTypeCommandOptions
>;

export const SelectProgressionTypeCommand: SelectProgressionTypeCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Select a progression type for a new progression definition')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, options) => {
    const { regionId, progressionKey } = options;

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setButtons((menu) =>
        getSelectProgressionTypeButtons(menu, regionId, progressionKey)
      )
      .setEmbeds((menu) =>
        getSelectProgressionTypeEmbeds(menu, regionId)
      )
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build();
  },
};

const getSelectProgressionTypeButtons = async (
  _menu: AdminMenu,
  regionId: string,
  progressionKey: string
): Promise<MenuButtonConfig<AdminMenu>[]> => {
  const types: Array<{ label: string; kind: string }> = [
    { label: '1 - Numeric', kind: 'numeric' },
    { label: '2 - Flag', kind: 'boolean' },
    { label: '3 - Milestone', kind: 'milestone' },
  ];

  return types.map(({ label, kind }) => ({
    label,
    style: ButtonStyle.Primary,
    onClick: async (menu) => {
      await MenuWorkflow.openMenu(
        menu,
        CONFIGURE_PROGRESSION_METADATA_COMMAND_NAME,
        {
          regionId,
          progressionKey,
          kind,
        }
      );
    },
  }));
};
