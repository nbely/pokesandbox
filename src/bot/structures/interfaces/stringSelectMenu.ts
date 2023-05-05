import { StringSelectMenuBuilder, StringSelectMenuInteraction } from "discord.js";

import { BotClient } from "@bot/index";
import IBaseCommand from "./baseCommand";

export default interface IStringSelectMenu extends IBaseCommand {
  component: StringSelectMenuBuilder;
  customId: string;
  execute: (client: BotClient, interaction: StringSelectMenuInteraction) => void;
}