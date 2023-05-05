import { statSync } from "fs";

import { BotClient } from "@bot/*";
import IStringSelectMenu from "@structures/interfaces/stringSelectMenu";
import { getFilesAsSingleArray } from "@structures/getFiles";

const stringSelectMenusManager = async (client: BotClient, rootPath: string) => {
  const selectMenuFiles: string[] = getFilesAsSingleArray(`${rootPath}/interactions/stringSelectMenus`);
  selectMenuFiles.forEach((selectMenuFile: string) => {
    if (statSync(selectMenuFile).isDirectory()) return;
    const selectMenuCommand: IStringSelectMenu = require(selectMenuFile).default;
    if (!selectMenuCommand.customId || !selectMenuCommand.execute) return;

    client.stringSelectMenus.set(selectMenuCommand.customId, selectMenuCommand);
  });
}

export default stringSelectMenusManager;
