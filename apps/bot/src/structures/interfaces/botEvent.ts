import type { BotClient } from '@bot/classes';

export interface IBotEvent {
  customEvent?: boolean;
  ignore?: boolean;
  name: string;
  execute: (name: string, client?: BotClient) => void;
}
