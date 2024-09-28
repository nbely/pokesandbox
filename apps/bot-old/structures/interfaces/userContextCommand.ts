import {
  ContextMenuCommandBuilder,
  UserContextMenuCommandInteraction,
} from "discord.js";

import { BotClient } from "@bot/index";
import IBaseCommand from "./baseCommand";

export default interface IUserContextCommand extends IBaseCommand {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  command: ContextMenuCommandBuilder | any;
  execute: (
    client: BotClient,
    interaction: UserContextMenuCommandInteraction,
  ) => void;
}
