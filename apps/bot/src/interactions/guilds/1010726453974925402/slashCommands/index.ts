import { ISlashCommand } from '@bot/structures/interfaces';

import * as RegionManagementCommands from './regionManagement';
import * as ServerManagementCommands from './serverManagement';

const getAllCommands = (
  commandImportMaps: Record<string, ISlashCommand>[]
): ISlashCommand[] =>
  commandImportMaps.reduce((acc, commandImportMap) => {
    const commands = Object.values(commandImportMap);
    return [...acc, ...commands];
  }, [] as ISlashCommand[]);

export const slashCommands = getAllCommands([
  RegionManagementCommands as any,
  ServerManagementCommands as any,
]);
