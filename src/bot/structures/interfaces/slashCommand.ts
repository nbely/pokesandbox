import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { BotClient } from "@bot/index";
import IBaseCommand from "./baseCommand";

export default interface ISlashCommand extends IBaseCommand {
  command: SlashCommandBuilder | any ;
  execute: (client: BotClient, interaction: ChatInputCommandInteraction) => void;
}