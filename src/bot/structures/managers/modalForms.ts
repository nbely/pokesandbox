import { statSync } from "fs";

import { BotClient } from "@bot/*";
import IModalForm from "@structures/interfaces/modalForm";
import { getFilesAsSingleArray } from "@structures/getFiles";

const modalFormsManager = async (client: BotClient, rootPath: string) => {
  const modalFormFiles: string[] = getFilesAsSingleArray(`${rootPath}/interactions/modalForms`);
  modalFormFiles.forEach((modalFormFile: string) => {
    if (statSync(modalFormFile).isDirectory()) return;
    const modalFormComponent: IModalForm = require(modalFormFile).default;
    if (!modalFormComponent.customId || !modalFormComponent.execute) return;

    client.modalForms.set(modalFormComponent.customId, modalFormComponent);
  });
}

export default modalFormsManager;
