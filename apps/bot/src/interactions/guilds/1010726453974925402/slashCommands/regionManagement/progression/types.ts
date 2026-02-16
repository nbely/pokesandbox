import type { AdminMenu, MenuButtonConfig } from '@bot/classes';
import type { ProgressionDefinition, Region } from '@shared';

export type EditFieldConfig = {
  handleInput: (
    progression: ProgressionDefinition,
    input: string
  ) => Promise<void>;
  hasClearButton?: boolean;
  hasMessageHandler?: boolean;
  getCustomButtons?: (
    config: EditFieldConfig,
    region: Region,
    progressionKey: string,
    progression: ProgressionDefinition
  ) => Promise<
    MenuButtonConfig<AdminMenu<EditProgressionDefinitionCommandOptions>>[]
  >;
};

export type EditProgressionDefinitionCommandOptions = {
  regionId: string;
  progressionKey: string;
};
