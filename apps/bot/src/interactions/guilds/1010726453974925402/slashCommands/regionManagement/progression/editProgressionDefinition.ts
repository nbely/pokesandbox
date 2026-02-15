import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import {
  AdminMenu,
  AdminMenuBuilder,
  MenuButtonConfig,
} from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';
import { Region } from '@shared/models';

import { getEditProgressionDefinitionEmbeds } from './progression.embeds';

const COMMAND_NAME = 'edit-progression-definition';
export const EDIT_PROGRESSION_DEFINITION_COMMAND_NAME = COMMAND_NAME;

type EditProgressionDefinitionCommandOptions = {
  regionId: string;
  progressionKey: string;
};
type EditProgressionDefinitionCommand = ISlashCommand<
  AdminMenu,
  EditProgressionDefinitionCommandOptions
>;

export const EditProgressionDefinitionCommand: EditProgressionDefinitionCommand = {
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
    const { regionId, progressionKey } = options;

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setButtons((menu) =>
        getEditProgressionDefinitionButtons(menu, regionId, progressionKey)
      )
      .setEmbeds((menu) =>
        getEditProgressionDefinitionEmbeds(menu, regionId, progressionKey)
      )
      .setMessageHandler(async (menu, response) => {
        await handleEditInput(menu, regionId, progressionKey, response);
      })
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build();
  },
};

const getEditProgressionDefinitionButtons = async (
  _menu: AdminMenu,
  regionId: string,
  progressionKey: string
): Promise<MenuButtonConfig<AdminMenu>[]> => {
  const region = await Region.findById(regionId);
  const progression = region.progressionDefinitions.get(progressionKey);

  if (!progression) {
    return [];
  }

  const buttons: MenuButtonConfig<AdminMenu>[] = [
    {
      label: 'Edit Display Name',
      style: ButtonStyle.Primary,
      onClick: async (menu) => {
        menu.prompt = 'Enter a new display name:';
        menu.metadata = { ...menu.metadata, editField: 'displayName' };
        await menu.refresh();
      },
    },
    {
      label: 'Edit Description',
      style: ButtonStyle.Primary,
      onClick: async (menu) => {
        menu.prompt = 'Enter a new description (or type "clear" to remove):';
        menu.metadata = { ...menu.metadata, editField: 'description' };
        await menu.refresh();
      },
    },
    {
      label: 'Edit Visibility',
      style: ButtonStyle.Primary,
      onClick: async (menu) => {
        menu.prompt = 'Enter new visibility (public/discoverable/hidden):';
        menu.metadata = { ...menu.metadata, editField: 'visibility' };
        await menu.refresh();
      },
    },
  ];

  // Add kind-specific buttons
  if (progression.kind === 'numeric') {
    buttons.push(
      {
        label: 'Edit Min',
        style: ButtonStyle.Primary,
        onClick: async (menu) => {
          menu.prompt = 'Enter a new minimum value (or type "clear" to remove):';
          menu.metadata = { ...menu.metadata, editField: 'min' };
          await menu.refresh();
        },
      },
      {
        label: 'Edit Max',
        style: ButtonStyle.Primary,
        onClick: async (menu) => {
          menu.prompt = 'Enter a new maximum value (or type "clear" to remove):';
          menu.metadata = { ...menu.metadata, editField: 'max' };
          await menu.refresh();
        },
      }
    );
  } else if (progression.kind === 'milestone') {
    buttons.push(
      {
        label: 'Toggle Sequential',
        style: ButtonStyle.Primary,
        onClick: async (menu) => {
          const region = await Region.findById(regionId);
          const progression = region.progressionDefinitions.get(progressionKey);
          if (progression && progression.kind === 'milestone') {
            progression.sequential = !progression.sequential;
            region.progressionDefinitions.set(progressionKey, progression);
            await region.save();
            menu.prompt = `Sequential mode ${progression.sequential ? 'enabled' : 'disabled'}`;
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
      const region = await Region.findById(regionId);
      region.progressionDefinitions.delete(progressionKey);
      await region.save();
      menu.prompt = `Successfully deleted progression "${progressionKey}"`;
      await menu.returnToPreviousMenu();
    },
  });

  return buttons;
};

const handleEditInput = async (
  menu: AdminMenu,
  regionId: string,
  progressionKey: string,
  response: string
) => {
  const editField = menu.metadata?.editField as string | undefined;
  
  if (!editField) {
    return;
  }

  const trimmedResponse = response.trim();
  const region = await Region.findById(regionId);
  const progression = region.progressionDefinitions.get(progressionKey);

  if (!progression) {
    menu.prompt = `Progression "${progressionKey}" not found.`;
    return menu.refresh();
  }

  switch (editField) {
    case 'displayName':
      if (!trimmedResponse) {
        menu.prompt = 'Display name cannot be empty. Please enter a valid name.';
        return menu.refresh();
      }
      progression.displayName = trimmedResponse;
      menu.prompt = 'Display name updated successfully.';
      break;

    case 'description':
      if (trimmedResponse.toLowerCase() === 'clear') {
        progression.description = undefined;
        menu.prompt = 'Description cleared.';
      } else {
        progression.description = trimmedResponse;
        menu.prompt = 'Description updated successfully.';
      }
      break;

    case 'visibility':
      const visibility = trimmedResponse.toLowerCase();
      if (!['public', 'discoverable', 'hidden'].includes(visibility)) {
        menu.prompt = 'Invalid visibility. Please enter public, discoverable, or hidden.';
        return menu.refresh();
      }
      progression.visibility = visibility as 'public' | 'discoverable' | 'hidden';
      menu.prompt = 'Visibility updated successfully.';
      break;

    case 'min':
      if (progression.kind !== 'numeric') {
        menu.prompt = 'Min value is only applicable to numeric progressions.';
        return menu.refresh();
      }
      if (trimmedResponse.toLowerCase() === 'clear') {
        progression.min = undefined;
        menu.prompt = 'Min value cleared.';
      } else {
        const min = parseFloat(trimmedResponse);
        if (isNaN(min)) {
          menu.prompt = 'Invalid number. Please enter a valid minimum value.';
          return menu.refresh();
        }
        progression.min = min;
        menu.prompt = 'Min value updated successfully.';
      }
      break;

    case 'max':
      if (progression.kind !== 'numeric') {
        menu.prompt = 'Max value is only applicable to numeric progressions.';
        return menu.refresh();
      }
      if (trimmedResponse.toLowerCase() === 'clear') {
        progression.max = undefined;
        menu.prompt = 'Max value cleared.';
      } else {
        const max = parseFloat(trimmedResponse);
        if (isNaN(max)) {
          menu.prompt = 'Invalid number. Please enter a valid maximum value.';
          return menu.refresh();
        }
        progression.max = max;
        menu.prompt = 'Max value updated successfully.';
      }
      break;

    default:
      menu.prompt = 'Unknown field.';
      return menu.refresh();
  }

  region.progressionDefinitions.set(progressionKey, progression);
  await region.save();
  
  // Clear the edit field metadata
  menu.metadata = { ...menu.metadata, editField: undefined };
  await menu.refresh();
};
