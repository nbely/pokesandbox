import type { IBotEvent } from '@bot/structures/interfaces';

import { ErrorManager } from './errorManager';
import { InteractionCreate } from './interactionCreate';
import { MessageCreate } from './messageCreate';
import { Ready } from './ready';

export const events: IBotEvent[] = [
  ErrorManager,
  InteractionCreate,
  MessageCreate,
  Ready,
];
