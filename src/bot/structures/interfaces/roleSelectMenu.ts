import { RoleSelectMenuBuilder, RoleSelectMenuInteraction } from "discord.js";

import { BotClient } from "@bot/index";
import IBaseCommand from "./baseCommand";

export default interface IRoleSelectMenu extends IBaseCommand {
  create: (options?: any) => RoleSelectMenuBuilder;
  execute: (client: BotClient, interaction: RoleSelectMenuInteraction) => void;
}