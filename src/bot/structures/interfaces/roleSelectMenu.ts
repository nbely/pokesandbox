import { RoleSelectMenuBuilder, RoleSelectMenuInteraction } from "discord.js";

import { BotClient } from "@bot/index";
import IBaseCommand from "./baseCommand";

export default interface IRoleSelectMenu extends IBaseCommand {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  create: (options?: any) => RoleSelectMenuBuilder;
  execute?: (client: BotClient, interaction: RoleSelectMenuInteraction) => void;
}
