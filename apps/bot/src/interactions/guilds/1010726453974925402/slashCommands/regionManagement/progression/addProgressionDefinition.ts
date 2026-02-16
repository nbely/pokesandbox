import {
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { AdminMenu, AdminMenuBuilder, MenuWorkflow } from '@bot/classes';
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
  AdminMenu<AddProgressionDefinitionCommandOptions>,
  AddProgressionDefinitionCommandOptions
>;

export const AddProgressionDefinitionCommand: AddProgressionDefinitionCommand =
  {
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
      if (!options?.regionId) {
        throw new Error(
          'Region ID is required to add a progression definition.'
        );
      }
      const { regionId } = options;

      const region = await Region.findById(regionId);
      if (!region) {
        throw new Error('Region not found.');
      }

      return new AdminMenuBuilder(session, COMMAND_NAME, options)
        .setEmbeds(async (menu) => [
          new EmbedBuilder()
            .setColor('Gold')
            .setAuthor({
              name: `${region.name} - Add Progression Definition`,
              iconURL: menu.interaction.guild?.iconURL() || undefined,
            })
            .setDescription(
              menu.prompt ||
                'Enter a name for the new progression definition (e.g., "Badges", "Z-Crystals", "Battle Points", etc.)'
            )
            .setTimestamp(),
        ])
        .setMessageHandler(async (menu, response) => {
          const progressionName = response.trim();

          if (!progressionName) {
            menu.prompt =
              'Progression name cannot be empty. Please enter a valid name.';
            return menu.refresh();
          }

          if (
            Array.from(region.progressionDefinitions.values()).some(
              (def) => def.name === progressionName
            )
          ) {
            menu.prompt = `A progression with name "${progressionName}" already exists. Please enter a different name.`;
            return menu.refresh();
          }

          // Navigate to select progression type
          await MenuWorkflow.openMenu(
            menu,
            SELECT_PROGRESSION_TYPE_COMMAND_NAME,
            {
              regionId,
              progressionName,
            }
          );
        })
        .setCancellable()
        .setReturnable()
        .build();
    },
  };
