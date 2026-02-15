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
import type { z } from 'zod';
import { progressionDefinitionSchema } from '@shared/models/region/progressionDefinition';

import { getConfigureProgressionMetadataEmbeds } from './progression.embeds';

const COMMAND_NAME = 'configure-progression-metadata';
export const CONFIGURE_PROGRESSION_METADATA_COMMAND_NAME = COMMAND_NAME;

type ConfigureProgressionMetadataCommandOptions = {
  regionId: string;
  progressionKey: string;
  kind: 'numeric' | 'boolean' | 'milestone';
};
type ConfigureProgressionMetadataCommand = ISlashCommand<
  AdminMenu,
  ConfigureProgressionMetadataCommandOptions
>;

export const ConfigureProgressionMetadataCommand: ConfigureProgressionMetadataCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Configure metadata for a progression definition')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, options) => {
    const { regionId, progressionKey, kind } = options;

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setEmbeds((menu) =>
        getConfigureProgressionMetadataEmbeds(menu, regionId, progressionKey, kind)
      )
      .setMessageHandler(async (menu, response) => {
        await handleMetadataInput(menu, regionId, progressionKey, kind, response);
      })
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build();
  },
};

type MetadataState = {
  displayName?: string;
  description?: string;
  visibility?: 'public' | 'discoverable' | 'hidden';
  min?: number;
  max?: number;
  sequential?: boolean;
  step: 'displayName' | 'description' | 'visibility' | 'min' | 'max' | 'sequential' | 'complete';
};

const handleMetadataInput = async (
  menu: AdminMenu,
  regionId: string,
  progressionKey: string,
  kind: 'numeric' | 'boolean' | 'milestone',
  response: string
) => {
  const state: MetadataState = (menu.metadata?.metadataState as MetadataState) || {
    step: 'displayName',
  };

  const trimmedResponse = response.trim();

  switch (state.step) {
    case 'displayName':
      if (!trimmedResponse) {
        menu.prompt = 'Display name cannot be empty. Please enter a display name.';
        return menu.refresh();
      }
      state.displayName = trimmedResponse;
      state.step = 'description';
      menu.prompt = 'Enter a description (or type "skip"):';
      menu.metadata = { ...menu.metadata, metadataState: state };
      return menu.refresh();

    case 'description':
      if (trimmedResponse.toLowerCase() !== 'skip') {
        state.description = trimmedResponse;
      }
      state.step = 'visibility';
      menu.prompt = 'Enter visibility (public/discoverable/hidden, or type "skip" for default "public"):';
      menu.metadata = { ...menu.metadata, metadataState: state };
      return menu.refresh();

    case 'visibility':
      if (trimmedResponse.toLowerCase() !== 'skip') {
        const visibility = trimmedResponse.toLowerCase();
        if (['public', 'discoverable', 'hidden'].includes(visibility)) {
          state.visibility = visibility as 'public' | 'discoverable' | 'hidden';
        } else {
          menu.prompt = 'Invalid visibility. Enter public, discoverable, or hidden (or type "skip"):';
          return menu.refresh();
        }
      }

      // Handle kind-specific fields
      if (kind === 'numeric') {
        state.step = 'min';
        menu.prompt = 'Enter minimum value (or type "skip"):';
        menu.metadata = { ...menu.metadata, metadataState: state };
        return menu.refresh();
      } else if (kind === 'milestone') {
        state.step = 'sequential';
        menu.prompt = 'Should milestones be sequential? (yes/no, or type "skip" for default "no"):';
        menu.metadata = { ...menu.metadata, metadataState: state };
        return menu.refresh();
      } else {
        // boolean type - we're done
        state.step = 'complete';
        return saveProgressionDefinition(menu, regionId, progressionKey, kind, state);
      }

    case 'min':
      if (trimmedResponse.toLowerCase() !== 'skip') {
        const min = parseFloat(trimmedResponse);
        if (isNaN(min)) {
          menu.prompt = 'Invalid number. Enter a minimum value (or type "skip"):';
          return menu.refresh();
        }
        state.min = min;
      }
      state.step = 'max';
      menu.prompt = 'Enter maximum value (or type "skip"):';
      menu.metadata = { ...menu.metadata, metadataState: state };
      return menu.refresh();

    case 'max':
      if (trimmedResponse.toLowerCase() !== 'skip') {
        const max = parseFloat(trimmedResponse);
        if (isNaN(max)) {
          menu.prompt = 'Invalid number. Enter a maximum value (or type "skip"):';
          return menu.refresh();
        }
        state.max = max;
      }
      state.step = 'complete';
      return saveProgressionDefinition(menu, regionId, progressionKey, kind, state);

    case 'sequential':
      if (trimmedResponse.toLowerCase() !== 'skip') {
        const sequential = trimmedResponse.toLowerCase();
        if (['yes', 'y', 'true', '1'].includes(sequential)) {
          state.sequential = true;
        } else if (['no', 'n', 'false', '0'].includes(sequential)) {
          state.sequential = false;
        } else {
          menu.prompt = 'Invalid input. Enter yes or no (or type "skip"):';
          return menu.refresh();
        }
      }
      state.step = 'complete';
      return saveProgressionDefinition(menu, regionId, progressionKey, kind, state);
  }
};

const saveProgressionDefinition = async (
  menu: AdminMenu,
  regionId: string,
  progressionKey: string,
  kind: 'numeric' | 'boolean' | 'milestone',
  state: MetadataState
) => {
  const region = await Region.findById(regionId);

  const baseDefinition = {
    displayName: state.displayName!,
    description: state.description,
    visibility: state.visibility || 'public' as const,
  };

  let progressionDefinition: z.infer<typeof progressionDefinitionSchema>;

  switch (kind) {
    case 'numeric':
      progressionDefinition = {
        kind: 'numeric' as const,
        ...baseDefinition,
        min: state.min,
        max: state.max,
      };
      break;
    case 'boolean':
      progressionDefinition = {
        kind: 'boolean' as const,
        ...baseDefinition,
      };
      break;
    case 'milestone':
      progressionDefinition = {
        kind: 'milestone' as const,
        ...baseDefinition,
        sequential: state.sequential || false,
        milestones: [],
      };
      break;
  }

  region.progressionDefinitions.set(progressionKey, progressionDefinition);
  await region.save();

  menu.prompt = `Successfully created progression definition "${progressionKey}"!`;
  
  // Return to the manage progression menu
  await MenuWorkflow.returnToPreviousMenu(menu);
};
