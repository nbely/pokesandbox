import type { IBotEvent } from '@bot/structures/interfaces';

export const ErrorManager: IBotEvent = {
  name: 'errorManager',
  customEvent: true,
  execute: async () => {
    process.on('unhandledRejection', (error) => {
      console.log(error);
    });
    process.on('uncaughtException', (error) => {
      console.log(error);
    });
  },
};
