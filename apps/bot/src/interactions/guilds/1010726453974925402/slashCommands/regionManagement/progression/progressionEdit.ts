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
import { ProgressionDefinition, Region } from '@shared/models';

import { MILESTONES_COMMAND_NAME } from './milestones';
import { progressionEditMenuEmbeds } from './progression.embeds';
import type {
  EditProgressionFieldConfig,
  ProgressionEditCommandOptions,
} from './types';
import {
  editProgressionFieldConfigMap,
  handleEditProgressionField,
} from './utils';

const COMMAND_NAME = 'progression-edit';
export const PROGRESSION_EDIT_COMMAND_NAME = COMMAND_NAME;

type ProgressionEditCommand = ISlashCommand<
  AdminMenu<ProgressionEditCommandOptions>,
  ProgressionEditCommandOptions
>;

export const ProgressionEditCommand: ProgressionEditCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Edit an existing progression definition')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, options) => {
    if (!options?.regionId || !options?.progressionKey) {
      throw new Error(
        'Region ID and progression key are required to edit a progression definition.'
      );
    }

    const { regionId, progressionKey } = options;
    const region = await Region.findById(regionId);
    if (!region) {
      throw new Error('Region not found');
    }

    const progression = region.progressionDefinitions.get(progressionKey);
    if (!progression) {
      throw new Error('Progression definition not found');
    }

    const progressionEditField = session.getState<string>(
      'progressionEditField'
    );
    const config = editProgressionFieldConfigMap.get(
      progressionEditField ?? ''
    );

    const builder = new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setEmbeds((menu) =>
        progressionEditMenuEmbeds(
          menu,
          region,
          progression,
          progressionEditField
        )
      )
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory();

    if (!progressionEditField) {
      builder.setButtons((menu) =>
        getEditProgressionDefinitionButtons(
          menu,
          region,
          progressionKey,
          progression
        )
      );
    } else {
      if (config?.getCustomButtons) {
        builder.setButtons(() =>
          getProgressionEditFieldButtons(
            config,
            region,
            progressionKey,
            progression
          )
        );
      }
      if (config?.hasMessageHandler) {
        builder.setMessageHandler(async (menu, response) => {
          await handleEditProgressionField(
            menu,
            config,
            region,
            progressionKey,
            progression,
            response
          );
        });
      }
    }

    return builder.build();
  },
};

const getEditProgressionDefinitionButtons = async (
  _menu: AdminMenu<ProgressionEditCommandOptions>,
  region: Region,
  progressionKey: string,
  progression: ProgressionDefinition
): Promise<MenuButtonConfig<AdminMenu<ProgressionEditCommandOptions>>[]> => {
  const buttons: MenuButtonConfig<AdminMenu<ProgressionEditCommandOptions>>[] =
    [
      {
        id: 'name',
        label: 'Name',
        style: ButtonStyle.Primary,
        onClick: async (menu) => {
          menu.session.setState('progressionEditField', 'name');
          await menu.hardRefresh();
        },
      },
      {
        id: 'description',
        label: 'Description',
        style: ButtonStyle.Primary,
        onClick: async (menu) => {
          menu.session.setState('progressionEditField', 'description');
          await menu.hardRefresh();
        },
      },
      {
        id: 'visibility',
        label: 'Visibility',
        style: ButtonStyle.Primary,
        onClick: async (menu) => {
          menu.session.setState('progressionEditField', 'visibility');
          await menu.hardRefresh();
        },
      },
    ];

  // Add kind-specific buttons
  if (progression.kind === 'numeric') {
    buttons.push(
      {
        id: 'min',
        label: 'Min Value',
        style: ButtonStyle.Primary,
        onClick: async (menu) => {
          menu.session.setState('progressionEditField', 'min');
          await menu.hardRefresh();
        },
      },
      {
        id: 'max',
        label: 'Max Value',
        style: ButtonStyle.Primary,
        onClick: async (menu) => {
          menu.session.setState('progressionEditField', 'max');
          await menu.hardRefresh();
        },
      }
    );
  } else if (progression.kind === 'milestone') {
    buttons.push(
      {
        label: 'Milestones',
        style: ButtonStyle.Primary,
        onClick: async (menu) => {
          await MenuWorkflow.openMenu(menu, MILESTONES_COMMAND_NAME, {
            regionId: region.id,
            progressionKey,
          });
        },
      },
      {
        label: 'Toggle Sequential',
        style: ButtonStyle.Primary,
        onClick: async (menu) => {
          if (progression.kind === 'milestone') {
            progression.sequential = !progression.sequential;
            region.progressionDefinitions.set(progressionKey, progression);
            await region.save();
            menu.prompt = `Sequential mode ${
              progression.sequential ? 'enabled' : 'disabled'
            }`;
            await menu.refresh();
          }
        },
      }
    );
  }

  // Add delete button
  buttons.push({
    label: 'Delete',
    style: ButtonStyle.Danger,
    onClick: async (menu) => {
      region.progressionDefinitions.delete(progressionKey);
      await region.save();
      await MenuWorkflow.completeAndReturn(menu);
    },
  });

  return buttons;
};

const getProgressionEditFieldButtons = async (
  config: EditProgressionFieldConfig,
  region: Region,
  progressionKey: string,
  progression: ProgressionDefinition
): Promise<MenuButtonConfig<AdminMenu<ProgressionEditCommandOptions>>[]> => {
  const buttons: MenuButtonConfig<AdminMenu<ProgressionEditCommandOptions>>[] =
    [];

  if (config.hasClearButton) {
    buttons.push({
      label: 'Clear',
      style: ButtonStyle.Danger,
      onClick: async (menu) => {
        await handleEditProgressionField(
          menu,
          config,
          region,
          progressionKey,
          progression,
          ''
        );
      },
    });
  }
  if (config.getCustomButtons) {
    const customButtons = await config.getCustomButtons(
      config,
      region,
      progressionKey,
      progression
    );
    buttons.push(...customButtons);
  }

  return buttons;
};
