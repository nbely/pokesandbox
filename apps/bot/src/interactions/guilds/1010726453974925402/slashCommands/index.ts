/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ISlashCommand } from '@bot/structures/interfaces';

import * as RegionManagementCommands from './regionManagement';
import * as ServerManagementCommands from './serverManagement';

const getAllCommands = (
  commandImportMaps: Record<string, ISlashCommand<any, any>>[]
): ISlashCommand<any, any>[] =>
  commandImportMaps.reduce<ISlashCommand<any, any>[]>(
    (acc, commandImportMap) => {
      const commands = Object.values(commandImportMap);
      return [...acc, ...commands];
    },
    []
  );

export const slashCommands = getAllCommands([
  RegionManagementCommands,
  ServerManagementCommands,
]);
