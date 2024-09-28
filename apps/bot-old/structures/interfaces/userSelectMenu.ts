import { UserSelectMenuBuilder, UserSelectMenuInteraction } from "discord.js";

import { BotClient } from "@bot/index";
import IBaseCommand from "./baseCommand";

export default interface IUserSelectMenu extends IBaseCommand {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  create: (options?: any) => UserSelectMenuBuilder;
  execute: (client: BotClient, interaction: UserSelectMenuInteraction) => void;
}
