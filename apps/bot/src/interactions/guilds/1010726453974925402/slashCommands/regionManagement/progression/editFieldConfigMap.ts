import capitalize from 'lodash/capitalize';

import type { ProgressionDefinition, Region } from '@shared';

import type { EditFieldConfig } from './types';
import { ButtonStyle } from 'discord.js';
import { assertProgressionKind, handleEditProgressionField } from './utils';

export const editFieldConfigMap = new Map<string, EditFieldConfig>([
  [
    'displayName',
    {
      hasMessageHandler: true,
      handleInput: async (
        progression: ProgressionDefinition,
        input: string
      ) => {
        progression.displayName = input;
      },
    },
  ],
  [
    'description',
    {
      hasClearButton: true,
      hasMessageHandler: true,
      handleInput: async (
        progression: ProgressionDefinition,
        input: string
      ) => {
        progression.description = input ? input : undefined;
      },
    },
  ],
  [
    'visibility',
    {
      hasMessageHandler: true,
      handleInput: async (
        progression: ProgressionDefinition,
        input: string
      ) => {
        if (!['public', 'discoverable', 'hidden'].includes(input)) {
          throw new Error('Invalid visibility option');
        }
        progression.visibility = input as ProgressionDefinition['visibility'];
      },
      getCustomButtons: async (
        config: EditFieldConfig,
        region: Region,
        progressionKey: string,
        progression: ProgressionDefinition
      ) => {
        const visibilityKeys = ['public', 'discoverable', 'hidden'] as const;
        return visibilityKeys
          .filter((option) => progression.visibility !== option)
          .map((option) => ({
            label: `Set to ${capitalize(option)}`,
            style: ButtonStyle.Primary,
            onClick: async (menu) => {
              await handleEditProgressionField(
                menu,
                config,
                region,
                progressionKey,
                progression,
                option
              );
            },
          }));
      },
    },
  ],
  [
    'min',
    {
      hasClearButton: true,
      hasMessageHandler: true,
      handleInput: async (
        progression: ProgressionDefinition,
        input: string
      ) => {
        assertProgressionKind(progression, 'numeric');
        if (input === '') {
          progression.min = undefined;
        } else {
          const min = parseFloat(input);
          if (isNaN(min)) {
            throw new Error('Invalid number');
          }
          progression.min = min;
        }
      },
    },
  ],
  [
    'max',
    {
      hasClearButton: true,
      hasMessageHandler: true,
      handleInput: async (
        progression: ProgressionDefinition,
        input: string
      ) => {
        assertProgressionKind(progression, 'numeric');
        if (input === '') {
          progression.max = undefined;
        } else {
          const max = parseFloat(input);
          if (isNaN(max)) {
            throw new Error('Invalid number');
          }
          progression.max = max;
        }
      },
    },
  ],
]);
