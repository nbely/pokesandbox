import { randomUUID } from 'node:crypto';
import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { saveRegion } from '@bot/cache';
import {
  AdminMenu,
  AdminMenuBuilder,
  MenuButtonConfig,
  MenuWorkflow,
} from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import {
  assertOptions,
  handleRegionAutocomplete,
  onlyAdminRoles,
} from '@bot/utils';
import type { ProgressionDefinition } from '@shared/models';

import { progressionCreateKindMenuEmbeds } from './progression.embeds';
import { PROGRESSION_EDIT_COMMAND_NAME } from './progressionEdit';

const COMMAND_NAME = 'progression-create-kind';
export const PROGRESSION_CREATE_KIND_COMMAND_NAME = COMMAND_NAME;

type ProgressionCreateKindCommandOptions = {
  region_id: string;
  progression_name: string;
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
  autocomplete: async (_client, interaction) => {
    await handleRegionAutocomplete(interaction);
  },
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription(
      'Select a progression type for a new progression definition'
    )
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('region_id')
        .setDescription('The region to add a progression to')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('progression_name')
        .setDescription('The name for the new progression definition')
        .setRequired(true)
    ),
  createMenu: async (session, options) => {
    assertOptions(options);
    const { region_id, progression_name } = options;

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setButtons((menu) =>
        getSelectProgressionTypeButtons(menu, region_id, progression_name)
      )
      .setEmbeds((menu) => progressionCreateKindMenuEmbeds(menu, region_id))
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
  const types: Array<{ label: string; kind: ProgressionDefinition['kind'] }> = [
    { label: 'Milestone', kind: 'milestone' },
    { label: 'Numeric', kind: 'numeric' },
    { label: 'Flag', kind: 'boolean' },
  ];

  return types.map(({ label, kind }) => ({
    label,
    style: ButtonStyle.Primary,
    onClick: async (menu) => {
      const region = await menu.getRegion(regionId);

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

      await saveRegion(region);
      await MenuWorkflow.openMenu(menu, PROGRESSION_EDIT_COMMAND_NAME, {
        region_id: regionId,
        progression_key: progressionKey,
      });
    },
  }));
};
