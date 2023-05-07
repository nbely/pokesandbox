import { Message } from "discord.js";

import { BotClient } from "@bot/index";
import IBotEvent from "@structures/interfaces/botEvent";
import { IServer } from "@models/server.model";
import commandOptionsProcessor from "@structures/commandOptions/processor";
import { findServer } from "@services/server.service";

const prefix = process.env.PREFIX as string;

const MessageCreate: IBotEvent = {
  name: "messageCreate",
  execute: (name: string, client?: BotClient) => {
    if (!client) return;
    client.on(name, async (message: Message) => {
      const server: IServer | null = await findServer({ serverId: message.guild?.id});
      const prefixes: string[] = server?.prefixes || [prefix]
      // if (!Array.isArray(server?.prefixes)) return;
      prefixes.forEach(async botPrefix => {
          if (!message.content.startsWith(botPrefix)) return;
          const commandName = message.content.toLowerCase().slice(botPrefix.length).trim().split(" ")[0];
          const command = client.messageCommands.get(commandName) ?? client.messageCommands.get(client.messageCommandsAliases.get(commandName) || "");
          if (!command) return;
          const args: string[] = message.content.slice(botPrefix.length).trim().slice(commandName.length).trim().split("  ");
          const authenticatedCMDOptions = await commandOptionsProcessor(client, message, command, false, "MessageCommand");
          
          if (command.allowInDms) {
              if (authenticatedCMDOptions) return await command.execute(client, message, args);
          } else if (!message.guild) return;
          else if (command.allowBots) {
              if (authenticatedCMDOptions) return await command.execute(client, message, args);
          } else if (message.author.bot) return;
          else if (authenticatedCMDOptions) return await command.execute(client, message, args);
      });
      
    });
  },
};

export default MessageCreate;
