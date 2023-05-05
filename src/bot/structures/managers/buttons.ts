import { ButtonBuilder, ButtonInteraction } from "discord.js";
import { statSync } from "fs";

import { BotClient } from "@bot/*";
import { getFilesAsSingleArray } from "@structures/getFiles";

export interface ButtonCommand {
  component: ButtonBuilder;
  customId: string;
  execute: (client: BotClient, interaction: ButtonInteraction) => void;
}

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
