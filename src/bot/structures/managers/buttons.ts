import { statSync } from "fs";

import { BotClient } from "@bot/index";
import ButtonCommand from "@structures/interfaces/buttonCommand";
import { getFilesAsSingleArray } from "@structures/getFiles";

const buttonsManager = async (client: BotClient, rootPath: string) => {
  const buttonFiles: string[] = getFilesAsSingleArray(`${rootPath}/interactions/buttons`);
  buttonFiles.forEach((buttonFile: string) => {
    if (statSync(buttonFile).isDirectory()) return;
    const buttonComponent: ButtonCommand = require(buttonFile).default;
    if (!buttonComponent.customId || !buttonComponent.execute) return;

    client.buttons.set(buttonComponent.customId, buttonComponent);
  });
}

export default buttonsManager;
