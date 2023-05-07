import { ButtonBuilder, ButtonInteraction } from "discord.js";

import { BotClient } from "@bot/index";
import IBaseCommand from "./baseCommand";

export default interface IButtonCommand extends IBaseCommand {
  component: ButtonBuilder;
  execute: (client: BotClient, interaction: ButtonInteraction) => void;
}
