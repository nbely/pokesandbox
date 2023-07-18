import { statSync } from "fs";

import { BotClient } from "@bot/index";
import { getFilesAsSingleArray } from "@structures/getFiles";

import IButtonCommand from "@structures/interfaces/buttonCommand";

const buttonsManager = async (client: BotClient, rootPath: string) => {
  const buttonFiles: string[] = getFilesAsSingleArray(
    `${rootPath}/interactions/buttons`,
  );
  for (const buttonFile of buttonFiles) {
    if (statSync(buttonFile).isDirectory()) return;
    const { default: buttonComponent }: { default: IButtonCommand } =
      await import(buttonFile);
    if (!buttonComponent || buttonComponent.ignore || !buttonComponent.name)
      return;

    client.buttons.set(buttonComponent.name, buttonComponent);
  }
};

export default buttonsManager;
