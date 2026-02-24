import {
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { getAssertedCachedRegion } from '@bot/cache';
import { AdminMenu, AdminMenuBuilder, MenuWorkflow } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import {
  assertOptions,
  handleRegionAutocomplete,
  onlyAdminRoles,
} from '@bot/utils';

import { PROGRESSION_CREATE_KIND_COMMAND_NAME } from './progressionCreateKind';

const COMMAND_NAME = 'progression-create-name';
export const PROGRESSION_CREATE_NAME_COMMAND_NAME = COMMAND_NAME;

type ProgressionCreateNameCommandOptions = {
  region_id: string;
};
type ProgressionCreateNameCommand = ISlashCommand<
  AdminMenu<ProgressionCreateNameCommandOptions>,
  ProgressionCreateNameCommandOptions
>;

export const ProgressionCreateNameCommand: ProgressionCreateNameCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  autocomplete: handleRegionAutocomplete,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Add a new progression definition to a region')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('region_id')
        .setDescription('The region to add a progression to')
        .setRequired(true)
        .setAutocomplete(true)
    ),
  createMenu: async (session, options) => {
    assertOptions(options);
    const { region_id } = options;
    const region = await getAssertedCachedRegion(region_id);

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
          PROGRESSION_CREATE_KIND_COMMAND_NAME,
          {
            region_id,
            progression_name: progressionName,
          }
        );
      })
      .setCancellable()
      .setReturnable()
      .build();
  },
};
