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

import { getEditProgressionDefinitionEmbeds } from './progression.embeds';
import {
  EditFieldConfig,
  EditProgressionDefinitionCommandOptions,
} from './types';
import { editFieldConfigMap } from './editFieldConfigMap';
import { handleEditProgressionField } from './utils';

const COMMAND_NAME = 'edit-progression-definition';
export const EDIT_PROGRESSION_DEFINITION_COMMAND_NAME = COMMAND_NAME;

type EditProgressionDefinitionCommand = ISlashCommand<
  AdminMenu<EditProgressionDefinitionCommandOptions>,
  EditProgressionDefinitionCommandOptions
>;

export const EditProgressionDefinitionCommand: EditProgressionDefinitionCommand =
  {
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
      const config = editFieldConfigMap.get(progressionEditField ?? '');

      const builder = new AdminMenuBuilder(session, COMMAND_NAME, options)
        .setEmbeds((menu) =>
          getEditProgressionDefinitionEmbeds(
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
  _menu: AdminMenu<EditProgressionDefinitionCommandOptions>,
  region: Region,
  progressionKey: string,
  progression: ProgressionDefinition
): Promise<
  MenuButtonConfig<AdminMenu<EditProgressionDefinitionCommandOptions>>[]
> => {
  const buttons: MenuButtonConfig<
    AdminMenu<EditProgressionDefinitionCommandOptions>
  >[] = [
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
          MenuWorkflow.openMenu(menu, 'edit-milestones', {
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
  config: EditFieldConfig,
  region: Region,
  progressionKey: string,
  progression: ProgressionDefinition
): Promise<
  MenuButtonConfig<AdminMenu<EditProgressionDefinitionCommandOptions>>[]
> => {
  const buttons: MenuButtonConfig<
    AdminMenu<EditProgressionDefinitionCommandOptions>
  >[] = [];

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
