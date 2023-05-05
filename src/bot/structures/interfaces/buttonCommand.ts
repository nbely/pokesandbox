import { ButtonBuilder, ButtonInteraction } from "discord.js";

import { BotClient } from "@bot/index";
import IBaseCommand from "./baseCommand";

export default interface IButtonCommand extends IBaseCommand {
  component: ButtonBuilder;
  customId: string;
  execute: (client: BotClient, interaction: ButtonInteraction) => void;
}
