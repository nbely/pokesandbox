import { statSync } from "fs";

import { BotClient } from "@bot/*";
import IModalForm from "@structures/interfaces/modalForm";
import { getFilesAsSingleArray } from "@structures/getFiles";

const modalFormsManager = async (client: BotClient, rootPath: string) => {
  const modalFormFiles: string[] = getFilesAsSingleArray(`${rootPath}/interactions/modalForms`);
  modalFormFiles.forEach((modalFormFile: string) => {
    if (statSync(modalFormFile).isDirectory()) return;
    const modalForm: IModalForm = require(modalFormFile).default;
    if (modalForm.ignore || !modalForm.name || !modalForm.execute) return;

    client.modalForms.set(modalForm.name, modalForm);
  });
}

export default modalFormsManager;
