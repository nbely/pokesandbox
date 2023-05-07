import { ContextMenuCommandBuilder, MessageContextMenuCommandInteraction } from "discord.js";

import { BotClient } from "@bot/index";
import IBaseCommand from "./baseCommand";

export default interface IMessageContextCommand extends IBaseCommand {
  command: ContextMenuCommandBuilder;
  execute: (client: BotClient, interaction: MessageContextMenuCommandInteraction) => void;
}
