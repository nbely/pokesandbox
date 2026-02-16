import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';
import { randomUUID } from 'node:crypto';

import {
  AdminMenu,
  AdminMenuBuilder,
  MenuButtonConfig,
  MenuWorkflow,
} from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';
import { ProgressionDefinition, Region } from '@shared';

import { getSelectProgressionTypeEmbeds } from './progression.embeds';
import { EDIT_PROGRESSION_DEFINITION_COMMAND_NAME } from './editProgressionDefinition';

const COMMAND_NAME = 'select-progression-type';
export const SELECT_PROGRESSION_TYPE_COMMAND_NAME = COMMAND_NAME;

type SelectProgressionTypeCommandOptions = {
  regionId: string;
  progressionName: string;
};
type SelectProgressionTypeCommand = ISlashCommand<
  AdminMenu<SelectProgressionTypeCommandOptions>,
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
    .setDescription(
      'Select a progression type for a new progression definition'
    )
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, options) => {
    if (!options?.regionId || !options?.progressionName) {
      throw new Error(
        'Region ID and progression name are required to select a progression type.'
      );
    }
    const { regionId, progressionName } = options;

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setButtons((menu) =>
        getSelectProgressionTypeButtons(menu, regionId, progressionName)
      )
      .setEmbeds((menu) => getSelectProgressionTypeEmbeds(menu, regionId))
      .setCancellable()
      .setReturnable()
      .build();
  },
};

const getSelectProgressionTypeButtons = async (
  _menu: AdminMenu<SelectProgressionTypeCommandOptions>,
  regionId: string,
  progressionName: string
): Promise<
  MenuButtonConfig<AdminMenu<SelectProgressionTypeCommandOptions>>[]
> => {
  const region = await Region.findById(regionId);
  if (!region) {
    throw new Error('Region not found.');
  }

  const types: Array<{ label: string; kind: ProgressionDefinition['kind'] }> = [
    { label: '1 - Milestone', kind: 'milestone' },
    { label: '2 - Numeric', kind: 'numeric' },
    { label: '3 - Flag', kind: 'boolean' },
  ];

  return types.map(({ label, kind }) => ({
    label,
    style: ButtonStyle.Primary,
    onClick: async (menu) => {
      const progressionKey = randomUUID();
      if (kind === 'numeric' || kind === 'boolean') {
        region.progressionDefinitions.set(progressionKey, {
          kind,
          displayName: progressionName,
          visibility: 'public',
        });
      } else {
        region.progressionDefinitions.set(progressionKey, {
          kind,
          displayName: progressionName,
          visibility: 'public',
          sequential: true,
          milestones: [],
        });
      }

      await region.save();
      await MenuWorkflow.openMenu(
        menu,
        EDIT_PROGRESSION_DEFINITION_COMMAND_NAME,
        {
          regionId,
          progressionKey,
        }
      );
    },
  }));
};
