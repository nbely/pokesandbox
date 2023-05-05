import { Message } from "discord.js";

import { BotClient } from "@bot/index";
import IBaseCommand from "./baseCommand";

export default interface IMessageCommand extends IBaseCommand {
  name: string,
  aliases?: string[]
  allowBots?: boolean,
  allowInDms?: boolean,
  execute: (client: BotClient, message: Message, args: string[]) => void;
}
