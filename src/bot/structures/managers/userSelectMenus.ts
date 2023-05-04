import { UserSelectMenuBuilder } from "@discordjs/builders";
import { UserSelectMenuInteraction } from "discord.js";
import { statSync } from "fs";

import { BotClient } from "@bot/*";
import { getFilesAsSingleArray } from "@structures/getFiles";

export interface UserSelectMenu {
  component: UserSelectMenuBuilder;
  customId: string;
  execute: (client: BotClient, interaction: UserSelectMenuInteraction) => void;
}

const userSelectMenusManager = async (client: BotClient, rootPath: string) => {
  const selectMenuFiles: string[] = getFilesAsSingleArray(`${rootPath}/interactions/userSelectMenus`);
  selectMenuFiles.forEach((selectMenuFile: string) => {
    if (statSync(selectMenuFile).isDirectory()) return;
    const selectMenuCommand: UserSelectMenu = require(selectMenuFile).default;
    if (!selectMenuCommand.customId || !selectMenuCommand.execute) return;

    client.userSelectMenus.set(selectMenuCommand.customId, selectMenuCommand);
  });
}

export default userSelectMenusManager;
