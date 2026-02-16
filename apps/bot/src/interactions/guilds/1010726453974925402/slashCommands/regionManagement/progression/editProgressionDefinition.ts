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

const COMMAND_NAME = 'edit-progression-definition';
export const EDIT_PROGRESSION_DEFINITION_COMMAND_NAME = COMMAND_NAME;

type EditProgressionDefinitionCommandOptions = {
  regionId: string;
  progressionKey: string;
};
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
        if (progressionEditField !== 'displayName') {
          builder.setButtons((menu) =>
            getProgressionEditFieldButtons(
              menu,
              region,
              progressionKey,
              progression,
              progressionEditField
            )
          );
        }
        if (progressionEditField !== 'visibility') {
          builder.setMessageHandler(async (menu, response) => {
            await handleEditInput(
              menu,
              region,
              progressionKey,
              progression,
              progressionEditField,
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
      id: 'displayName',
      label: 'Name',
      style: ButtonStyle.Primary,
      onClick: async (menu) => {
        menu.session.setState('progressionEditField', 'displayName');
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
      await menu.hardRefresh();
    },
  });

  return buttons;
};

const getProgressionEditFieldButtons = async (
  _menu: AdminMenu<EditProgressionDefinitionCommandOptions>,
  region: Region,
  progressionKey: string,
  progression: ProgressionDefinition,
  editField: string
): Promise<
  MenuButtonConfig<AdminMenu<EditProgressionDefinitionCommandOptions>>[]
> => {
  const buttons: MenuButtonConfig<
    AdminMenu<EditProgressionDefinitionCommandOptions>
  >[] = [];

  if (['description', 'min', 'max'].includes(editField)) {
    buttons.push({
      label: 'Clear',
      style: ButtonStyle.Danger,
      onClick: async (menu) => {
        await handleEditInput(
          menu,
          region,
          progressionKey,
          progression,
          editField,
          ''
        );
      },
    });
  } else if (editField === 'visibility') {
    if (progression.visibility !== 'public') {
      buttons.push({
        label: 'Set to Public',
        style: ButtonStyle.Primary,
        onClick: async (menu) => {
          await handleEditInput(
            menu,
            region,
            progressionKey,
            progression,
            editField,
            'public'
          );
        },
      });
    }
    if (progression.visibility !== 'discoverable') {
      buttons.push({
        label: 'Set to Discoverable',
        style: ButtonStyle.Primary,
        onClick: async (menu) => {
          await handleEditInput(
            menu,
            region,
            progressionKey,
            progression,
            editField,
            'discoverable'
          );
        },
      });
    }
    if (progression.visibility !== 'hidden') {
      buttons.push({
        label: 'Set to Hidden',
        style: ButtonStyle.Primary,
        onClick: async (menu) => {
          await handleEditInput(
            menu,
            region,
            progressionKey,
            progression,
            editField,
            'hidden'
          );
        },
      });
    }
  }

  return buttons;
};

const handleEditInput = async (
  menu: AdminMenu<EditProgressionDefinitionCommandOptions>,
  region: Region,
  progressionKey: string,
  progression: ProgressionDefinition,
  editField: string,
  response: string
) => {
  switch (editField) {
    case 'displayName':
      progression.displayName = response;
      break;

    case 'description':
      progression.description = response ? response : undefined;
      break;

    case 'visibility':
      if (!['public', 'discoverable', 'hidden'].includes(response)) {
        menu.prompt =
          'Invalid visibility option. Please select a valid option.';
        return menu.refresh();
      }
      progression.visibility = response as ProgressionDefinition['visibility'];
      break;

    case 'min':
      if (progression.kind !== 'numeric') {
        menu.prompt = 'Min value is only applicable to numeric progressions.';
        return menu.refresh();
      }
      if (response === '') {
        progression.min = undefined;
      } else {
        const min = parseFloat(response);
        if (isNaN(min)) {
          menu.prompt = 'Invalid number. Please enter a valid minimum value.';
          return menu.refresh();
        }
        progression.min = min;
      }
      break;

    case 'max':
      if (progression.kind !== 'numeric') {
        menu.prompt = 'Max value is only applicable to numeric progressions.';
        return menu.refresh();
      }
      if (response === '') {
        progression.max = undefined;
        menu.prompt = 'Max value cleared.';
      } else {
        const max = parseFloat(response);
        if (isNaN(max)) {
          menu.prompt = 'Invalid number. Please enter a valid maximum value.';
          return menu.refresh();
        }
        progression.max = max;
        menu.prompt = 'Max value updated successfully.';
      }
      break;
  }

  region.progressionDefinitions.set(progressionKey, progression);
  await region.save();

  menu.session.deleteState('progressionEditField');
  await menu.hardRefresh();
};
