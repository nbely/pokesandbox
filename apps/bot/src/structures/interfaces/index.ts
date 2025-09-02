import { InteractionContextType } from 'discord.js';

export type { IBotEvent } from './botEvent';
export * from './commands';
export * from './interactions';
export { UserPermissions } from './permissions';

export const ALL_INTERACTION_CONTEXTS = [
  InteractionContextType.BotDM,
  InteractionContextType.Guild,
  InteractionContextType.PrivateChannel,
];
