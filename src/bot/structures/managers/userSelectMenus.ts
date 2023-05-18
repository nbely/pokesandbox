import { statSync } from "fs";

import { BotClient } from "@bot/index";
import IUserSelectMenu from "@structures/interfaces/userSelectMenu";
import { getFilesAsSingleArray } from "@structures/getFiles";

const userSelectMenusManager = async (client: BotClient, rootPath: string) => {
  const selectMenuFiles: string[] = getFilesAsSingleArray(`${rootPath}/interactions/userSelectMenus`);
  selectMenuFiles.forEach((selectMenuFile: string) => {
    if (statSync(selectMenuFile).isDirectory()) return;
    const selectMenuCommand: IUserSelectMenu = require(selectMenuFile).default;
    if (selectMenuCommand.ignore || !selectMenuCommand.name || !selectMenuCommand.execute) return;

    client.userSelectMenus.set(selectMenuCommand.name, selectMenuCommand);
  });
}

export default userSelectMenusManager;
