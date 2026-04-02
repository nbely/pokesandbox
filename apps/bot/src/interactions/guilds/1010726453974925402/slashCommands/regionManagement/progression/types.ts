import type { AdminMenuContext } from '@bot/classes';
import type { ProgressionDefinition, Region } from '@shared/models';
import type { ButtonInputConfig } from '@flowcord/core';

export type ProgressionsMenuState = {
  prompt?: string;
};

export type ProgressionEditMenuState = {
  prompt?: string;
  progressionEditField?: string;
};

export type EditProgressionFieldConfig = {
  handleInput: (
    progression: ProgressionDefinition,
    input: string
  ) => Promise<void>;
  hasClearButton?: boolean;
  hasMessageHandler?: boolean;
  getCustomButtons?: (
    config: EditProgressionFieldConfig,
    region: Region,
    progressionKey: string,
    progression: ProgressionDefinition
  ) => Promise<ButtonInputConfig<AdminMenuContext<ProgressionEditMenuState>>[]>;
};
