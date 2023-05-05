import {
  ChatInputCommandInteraction,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  REST,
  Routes,
  SlashCommandBuilder,
  UserContextMenuCommandInteraction,
} from "discord.js";

import { BotClient } from "@bot/index";
import { getFilesAsNestedArrays, getFilesAsSingleArray } from "../getFiles";

const CLIENT_ID = process.env.CLIENT_ID as string;
const TOKEN = process.env.POKE_SANDBOT_TOKEN as string;

export interface SlashCommand {
  command: SlashCommandBuilder | any ;
  execute: (client: BotClient, interaction: ChatInputCommandInteraction) => void;
}

export interface MessageContextCommand {
  command: ContextMenuCommandBuilder | any;
  execute: (client: BotClient, interaction: MessageContextMenuCommandInteraction) => void;
}

export interface UserContextCommand {
  command: ContextMenuCommandBuilder | any;
  execute: (client: BotClient, interaction: UserContextMenuCommandInteraction) => void;
}

type Command = SlashCommand | MessageContextCommand | UserContextCommand;

const slashCommandsManager = async (client: BotClient, rootPath: string) => {
  const globalSlashCommandsFiles = getFilesAsSingleArray(`${rootPath}/interactions/slashCommands/global`);
  const allGuildsSlashCommandsFiles = getFilesAsNestedArrays(`${rootPath}/interactions/slashCommands/guilds`);
  const rest = new REST({ version: '10' }).setToken(TOKEN);

  if (globalSlashCommandsFiles?.length > 0) {
    let globalSlashCommands: Command[] = [];
    await globalSlashCommandsFiles.forEach(async (globalFile: string) => {
      const globalCommand: Command = require(globalFile).default;
      if (!globalCommand.command || !globalCommand.execute) return;
      client.slashCommands.set(globalCommand.command.name, globalCommand);
      globalSlashCommands.push(globalCommand.command.toJSON());
    });
    try {
      // await rest.put(Routes.applicationCommands(CLIENT_ID), { body: globalSlashCommands });
    } catch (error) {
      console.log(error);
    }
  };
  
  if (allGuildsSlashCommandsFiles?.length > 0) {
    allGuildsSlashCommandsFiles.forEach(async (guild: any) => {
      let guildSlashCommands: Command[] = [];
      const guildId: string = guild.flat(9999)[0].split(`${rootPath}/interactions/slashCommands/guilds`)[1].split("/")[1];
      await guild.flat(9999).forEach(async (commandFile: string) => {
        const guildCommand: Command = require(commandFile).default;
        if (!guildCommand.command || !guildCommand.execute) return;
        client.slashCommands.set(guildCommand.command.name, guildCommand);
        
        guildSlashCommands.push(guildCommand.command.toJSON());
      });
      try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: guildSlashCommands });
      } catch (error) {
        console.log(error);
      }
    });
  };
}

export default slashCommandsManager;
