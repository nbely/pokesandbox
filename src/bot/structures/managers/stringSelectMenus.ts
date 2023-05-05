import { StringSelectMenuBuilder, StringSelectMenuInteraction } from "discord.js";
import { statSync } from "fs";

import { BotClient } from "@bot/*";
import { getFilesAsSingleArray } from "@structures/getFiles";

export interface StringSelectMenu {
  component: StringSelectMenuBuilder;
  customId: string;
  execute: (client: BotClient, interaction: StringSelectMenuInteraction) => void;
}

const stringSelectMenusManager = async (client: BotClient, rootPath: string) => {
  const selectMenuFiles: string[] = getFilesAsSingleArray(`${rootPath}/interactions/stringSelectMenus`);
  selectMenuFiles.forEach((selectMenuFile: string) => {
    if (statSync(selectMenuFile).isDirectory()) return;
    const selectMenuCommand: StringSelectMenu = require(selectMenuFile).default;
    if (!selectMenuCommand.customId || !selectMenuCommand.execute) return;

    client.stringSelectMenus.set(selectMenuCommand.customId, selectMenuCommand);
  });
}

export default stringSelectMenusManager;
