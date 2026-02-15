import {
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import {
  AdminMenu,
  AdminMenuBuilder,
  MenuWorkflow,
} from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';
import { Region } from '@shared/models';

import { SELECT_PROGRESSION_TYPE_COMMAND_NAME } from './selectProgressionType';

const COMMAND_NAME = 'add-progression-definition';
export const ADD_PROGRESSION_DEFINITION_COMMAND_NAME = COMMAND_NAME;

type AddProgressionDefinitionCommandOptions = {
  regionId: string;
};
type AddProgressionDefinitionCommand = ISlashCommand<
  AdminMenu,
  AddProgressionDefinitionCommandOptions
>;

export const AddProgressionDefinitionCommand: AddProgressionDefinitionCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Add a new progression definition to a region')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, options) => {
    const { regionId } = options;
    const region = await Region.findById(regionId);

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setEmbeds((menu) => [
        {
          color: 0xffd700,
          author: {
            name: `${region.name} - Add Progression Definition`,
            icon_url: menu.interaction.guild?.iconURL() || undefined,
          },
          description:
            menu.prompt ||
            'Enter a unique key for the new progression definition (e.g., "badges", "pokedex_seen", "story_progress").',
          timestamp: new Date().toISOString(),
        },
      ])
      .setMessageHandler(async (menu, response) => {
        const progressionKey = response.trim();

        if (!progressionKey) {
          menu.prompt = 'Progression key cannot be empty. Please enter a valid key.';
          return menu.refresh();
        }

        // Validate key format (alphanumeric and underscores only)
        if (!/^[a-zA-Z0-9_]+$/.test(progressionKey)) {
          menu.prompt = 'Progression key can only contain letters, numbers, and underscores. Please try again.';
          return menu.refresh();
        }

        const region = await Region.findById(regionId);

        if (region.progressionDefinitions.has(progressionKey)) {
          menu.prompt = `A progression with key "${progressionKey}" already exists. Please enter a different key.`;
          return menu.refresh();
        }

        // Navigate to select progression type
        await MenuWorkflow.openMenu(menu, SELECT_PROGRESSION_TYPE_COMMAND_NAME, {
          regionId,
          progressionKey,
        });
      })
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build();
  },
};
