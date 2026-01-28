import type { IMessageContextCommand } from '@bot/structures/interfaces';

import { GetMessageId } from './getMessageId/getMessageId';

export const messageContextCommands: IMessageContextCommand[] = [GetMessageId];
