import {
  ChatInputCommandInteraction,
  Client,
  SlashCommandBuilder,
} from "discord.js";
import { join } from "path";
import { readdirSync } from "fs";

export interface SlashCommand {
  command: SlashCommandBuilder | any ;
  execute: (client: Client, interaction: ChatInputCommandInteraction) => void;
}

const getCommands = (): SlashCommand[] => {
  const commands: SlashCommand[] = [];
  const commandsDir: string = join(__dirname, "/commands");
  
  readdirSync(commandsDir).forEach(file => {
    if (!file.endsWith("ts")) {
      return;
    }
    const command: SlashCommand = require(`${commandsDir}/${file}`).default;
    commands.push(command);
  });
  
  return commands;
};

export const commands: SlashCommand[] = getCommands();
