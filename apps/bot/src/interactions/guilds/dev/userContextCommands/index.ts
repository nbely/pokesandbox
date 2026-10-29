import type { IUserContextCommand } from '@bot/structures/interfaces';

import { GetUserTag } from './getUserTag/getuserTag';

export const userContextCommands: IUserContextCommand[] = [GetUserTag];
