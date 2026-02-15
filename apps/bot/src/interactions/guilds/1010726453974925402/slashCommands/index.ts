import { ISlashCommand } from '@bot/structures/interfaces';

import * as RegionManagementCommands from './regionManagement';
import * as ServerManagementCommands from './serverManagement';

const getAllCommands = (
  commandImportMaps: Record<string, ISlashCommand<any, any>>[]
): ISlashCommand<any, any>[] =>
  commandImportMaps.reduce((acc, commandImportMap) => {
    const commands = Object.values(commandImportMap);
    return [...acc, ...commands];
  }, [] as ISlashCommand<any, any>[]);

export const slashCommands = getAllCommands([
  RegionManagementCommands as Record<string, ISlashCommand<any, any>>,
  ServerManagementCommands as Record<string, ISlashCommand<any, any>>,
]);
