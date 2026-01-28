import type { IBotEvent } from '@bot/structures/interfaces';

import { ClientReady } from './clientReady';
import { ErrorManager } from './errorManager';
import { InteractionCreate } from './interactionCreate';
import { MessageCreate } from './messageCreate';

export const events: IBotEvent[] = [
  ClientReady,
  ErrorManager,
  InteractionCreate,
  MessageCreate,
];
