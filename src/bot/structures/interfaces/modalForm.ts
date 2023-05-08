import { ModalBuilder, ModalSubmitInteraction } from "discord.js";

import { BotClient } from "@bot/index";
import IBaseCommand from "./baseCommand";

export default interface IModalForm extends IBaseCommand {
  create: (options?: any) => ModalBuilder;
  execute: (client: BotClient, interaction: ModalSubmitInteraction) => void;
}
