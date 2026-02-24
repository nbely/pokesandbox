import { Message } from 'discord.js';

import { getCachedServer } from '@bot/cache';
import type { BotClient } from '@bot/classes';
import { commandOptionsProcessor } from '@bot/structures/commandOptions/processor';
import type { IBotEvent } from '@bot/structures/interfaces';

const prefix = process.env.PREFIX as string;

export const MessageCreate: IBotEvent = {
  name: 'messageCreate',
  execute: (name: string, client?: BotClient) => {
    if (!client) return;
    client.on(name, async (message: Message) => {
      const server = await getCachedServer(message.guild?.id);
      const prefixes: string[] = server?.prefixes || [prefix];

      prefixes.forEach(async (botPrefix) => {
        if (!message.content.startsWith(botPrefix)) return;
        const commandName = message.content
          .toLowerCase()
          .slice(botPrefix.length)
          .trim()
          .split(' ')[0];
        const command =
          client.messageCommands.get(commandName) ??
          client.messageCommands.get(
            client.messageCommandsAliases.get(commandName) || ''
          );
        if (!command) return;
        const args: string[] = message.content
          .slice(botPrefix.length)
          .trim()
          .slice(commandName.length)
          .trim()
          .split('  ');
        const authenticatedCMDOptions = await commandOptionsProcessor(
          client,
          message,
          command,
          false,
          'MessageCommand'
        );

        if (command.allowInDms) {
          if (authenticatedCMDOptions)
            return await command.execute(client, message, args);
        } else if (!message.guild) return;
        else if (command.allowBots) {
          if (authenticatedCMDOptions)
            return await command.execute(client, message, args);
        } else if (message.author.bot) return;
        else if (authenticatedCMDOptions)
          return await command.execute(client, message, args);
      });
    });
  },
};
