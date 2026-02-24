import assert from 'node:assert';
import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { getAssertedCachedRegion, saveRegion } from '@bot/cache';
import {
  AdminMenu,
  AdminMenuBuilder,
  MenuButtonConfig,
  MenuWorkflow,
} from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { assertOptions, onlyAdminRoles } from '@bot/utils';
import { ProgressionDefinition } from '@shared/models';

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
    assertOptions(options);
    const { regionId, progressionKey } = options;
    const region = await getAssertedCachedRegion(regionId);
    const progression = region.progressionDefinitions.get(progressionKey);
    assert(progression, 'Progression definition not found');

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
          regionId,
          progressionKey,
          progressionEditField
        )
      )
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory();

    if (!progressionEditField) {
      builder.setButtons((menu) =>
        getEditProgressionDefinitionButtons(menu, regionId, progressionKey)
      );
    } else {
      if (config?.getCustomButtons) {
        builder.setButtons((menu) =>
          getProgressionEditFieldButtons(menu, config, regionId, progressionKey)
        );
      }
      if (config?.hasMessageHandler) {
        builder.setMessageHandler(async (menu, response) => {
          await handleEditProgressionField(
            menu,
            config,
            regionId,
            progressionKey,
            response
          );
        });
      }
    }

    return builder.build();
  },
};

const getEditProgressionDefinitionButtons = async (
  menu: AdminMenu<ProgressionEditCommandOptions>,
  regionId: string,
  progressionKey: string
): Promise<MenuButtonConfig<AdminMenu<ProgressionEditCommandOptions>>[]> => {
  const region = await menu.getRegion(regionId);
  const progression = region.progressionDefinitions.get(progressionKey);
  assert(progression, 'Progression definition not found');

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
            regionId,
            progressionKey,
          });
        },
      },
      {
        label: 'Toggle Sequential',
        style: ButtonStyle.Primary,
        onClick: async (menu) => {
          const region = await menu.getRegion(regionId);
          if (progression.kind === 'milestone') {
            progression.sequential = !progression.sequential;
            region.progressionDefinitions.set(progressionKey, progression);
            await saveRegion(region);
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
      const region = await menu.getRegion(regionId);
      region.progressionDefinitions.delete(progressionKey);
      await saveRegion(region);
      await MenuWorkflow.completeAndReturn(menu);
    },
  });

  return buttons;
};

const getProgressionEditFieldButtons = async (
  menu: AdminMenu<ProgressionEditCommandOptions>,
  config: EditProgressionFieldConfig,
  regionId: string,
  progressionKey: string
): Promise<MenuButtonConfig<AdminMenu<ProgressionEditCommandOptions>>[]> => {
  const region = await menu.getRegion(regionId);
  const progression = region.progressionDefinitions.get(progressionKey);
  assert(progression, 'Progression definition not found');

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
          regionId,
          progressionKey,
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
