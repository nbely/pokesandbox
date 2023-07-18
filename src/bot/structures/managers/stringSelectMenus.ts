import { statSync } from "fs";

import { BotClient } from "@bot/index";
import IStringSelectMenu from "@structures/interfaces/stringSelectMenu";
import { getFilesAsSingleArray } from "@structures/getFiles";

const stringSelectMenusManager = async (client: BotClient, rootPath: string) => {
  const selectMenuFiles: string[] = getFilesAsSingleArray(`${rootPath}/interactions/stringSelectMenus`);
  selectMenuFiles.forEach((selectMenuFile: string) => {
    if (statSync(selectMenuFile).isDirectory()) return;
    const selectMenuCommand: IStringSelectMenu = require(selectMenuFile).default;
    if (selectMenuCommand.ignore || !selectMenuCommand.name || !selectMenuCommand.execute) return;

    client.stringSelectMenus.set(selectMenuCommand.name, selectMenuCommand);
  });
}

export default stringSelectMenusManager;
