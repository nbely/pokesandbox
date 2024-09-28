import { ButtonBuilder, ButtonInteraction } from "discord.js";

import { BotClient } from "@bot/index";
import IBaseCommand from "./baseCommand";

export default interface IButtonCommand extends IBaseCommand {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  create: (options?: any) => ButtonBuilder;
  execute?: (client: BotClient, interaction: ButtonInteraction) => void;
}
