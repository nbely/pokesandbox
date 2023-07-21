import { statSync } from "fs";

import { BotClient } from "@bot/index";
import { getFilesAsSingleArray } from "@structures/getFiles";

import IModalForm from "@structures/interfaces/modalForm";

const modalFormsManager = async (client: BotClient, rootPath: string) => {
  const modalFormFiles: string[] = getFilesAsSingleArray(
    `${rootPath}/interactions/modalForms`,
  );
  for (const modalFormFile of modalFormFiles) {
    if (statSync(modalFormFile).isDirectory()) return;
    const { default: modalForm }: { default: IModalForm } = await import(
      modalFormFile
    );
    if (modalForm.ignore || !modalForm.name || !modalForm.execute) return;

    client.modalForms.set(modalForm.name, modalForm);
  }
};

export default modalFormsManager;
