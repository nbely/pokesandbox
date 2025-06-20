import { ISlashCommand } from '@bot/structures/interfaces';

import * as ServerManagementCommands from './serverManagement';

const getAllCommands = (
  commandImportMaps: Record<string, ISlashCommand>[]
): ISlashCommand[] =>
  commandImportMaps.reduce((acc, commandImportMap) => {
    const commands = Object.values(commandImportMap);
    return [...acc, ...commands];
  }, [] as ISlashCommand[]);

export const slashCommands = getAllCommands([ServerManagementCommands]);
