import { statSync } from "fs";

import { BotClient } from "@bot/index";
import ButtonCommand from "@structures/interfaces/buttonCommand";
import { getFilesAsSingleArray } from "@structures/getFiles";

const buttonsManager = async (client: BotClient, rootPath: string) => {
  const buttonFiles: string[] = getFilesAsSingleArray(`${rootPath}/interactions/buttons`);
  buttonFiles.forEach((buttonFile: string) => {
    if (statSync(buttonFile).isDirectory()) return;
    const buttonComponent: ButtonCommand | undefined = require(buttonFile).default;
    if (!buttonComponent || buttonComponent.ignore || !buttonComponent.name) return;

    client.buttons.set(buttonComponent.name, buttonComponent);
  });
}

export default buttonsManager;
