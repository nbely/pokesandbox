import type { AdminMenu, MenuButtonConfig } from '@bot/classes';
import type { ProgressionDefinition, Region } from '@shared/models';

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
  ) => Promise<MenuButtonConfig<AdminMenu<ProgressionEditCommandOptions>>[]>;
};

export type ProgressionEditCommandOptions = {
  region_id: string;
  progression_key: string;
};
