import { randomUUID } from 'node:crypto';
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
import { ProgressionDefinition, Region } from '@shared';

import { progressionCreateKindMenuEmbeds } from './progression.embeds';
import { PROGRESSION_EDIT_COMMAND_NAME } from './progressionEdit';

const COMMAND_NAME = 'progression-create-kind';
export const PROGRESSION_CREATE_KIND_COMMAND_NAME = COMMAND_NAME;

type ProgressionCreateKindCommandOptions = {
  regionId: string;
  progressionName: string;
};
type ProgressionCreateKindCommand = ISlashCommand<
  AdminMenu<ProgressionCreateKindCommandOptions>,
  ProgressionCreateKindCommandOptions
>;

export const ProgressionCreateKindCommand: ProgressionCreateKindCommand = {
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
      .setEmbeds((menu) => progressionCreateKindMenuEmbeds(menu, regionId))
      .setCancellable()
      .setReturnable()
      .build();
  },
};

const getSelectProgressionTypeButtons = async (
  _menu: AdminMenu<ProgressionCreateKindCommandOptions>,
  regionId: string,
  progressionName: string
): Promise<
  MenuButtonConfig<AdminMenu<ProgressionCreateKindCommandOptions>>[]
> => {
  const region = await Region.findById(regionId);
  if (!region) {
    throw new Error('Region not found.');
  }

  const types: Array<{ label: string; kind: ProgressionDefinition['kind'] }> = [
    { label: 'Milestone', kind: 'milestone' },
    { label: 'Numeric', kind: 'numeric' },
    { label: 'Flag', kind: 'boolean' },
  ];

  return types.map(({ label, kind }) => ({
    label,
    style: ButtonStyle.Primary,
    onClick: async (menu) => {
      const progressionKey = randomUUID();
      if (kind === 'numeric' || kind === 'boolean') {
        region.progressionDefinitions.set(progressionKey, {
          kind,
          name: progressionName,
          visibility: 'public',
        });
      } else {
        region.progressionDefinitions.set(progressionKey, {
          kind,
          name: progressionName,
          visibility: 'public',
          sequential: true,
          milestones: [],
        });
      }

      await region.save();
      await MenuWorkflow.openMenu(menu, PROGRESSION_EDIT_COMMAND_NAME, {
        regionId,
        progressionKey,
      });
    },
  }));
};
