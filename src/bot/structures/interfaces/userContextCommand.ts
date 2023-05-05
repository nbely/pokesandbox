import { ContextMenuCommandBuilder, UserContextMenuCommandInteraction } from "discord.js";

import { BotClient } from "@bot/index";
import IBaseCommand from "./baseCommand";

export default interface IUserContextCommand extends IBaseCommand {
  command: ContextMenuCommandBuilder | any;
  execute: (client: BotClient, interaction: UserContextMenuCommandInteraction) => void;
}
