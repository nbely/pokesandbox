import { ModalBuilder, ModalSubmitInteraction } from "discord.js";
import { statSync } from "fs";

import { BotClient } from "@bot/*";
import { getFilesAsSingleArray } from "@structures/getFiles";

export interface ModalForm {
  component: ModalBuilder;
  customId: string;
  execute: (client: BotClient, interaction: ModalSubmitInteraction) => void;
}

const modalFormsManager = async (client: BotClient, rootPath: string) => {
  const modalFormFiles: string[] = getFilesAsSingleArray(`${rootPath}/interactions/modalForms`);
  modalFormFiles.forEach((modalFormFile: string) => {
    if (statSync(modalFormFile).isDirectory()) return;
    const modalFormComponent: ModalForm = require(modalFormFile).default;
    if (!modalFormComponent.customId || !modalFormComponent.execute) return;

    client.modalForms.set(modalFormComponent.customId, modalFormComponent);
  });
}

export default modalFormsManager;
