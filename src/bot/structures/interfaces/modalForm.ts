import { ModalBuilder, ModalSubmitInteraction } from "discord.js";

import { BotClient } from "@bot/index";
import IBaseCommand from "./baseCommand";

export default interface IModalForm extends IBaseCommand {
  component: ModalBuilder;
  customId: string;
  execute: (client: BotClient, interaction: ModalSubmitInteraction) => void;
}
