import { statSync } from "fs";

import { BotClient } from "@bot/index";
import IRoleSelectMenu from "@structures/interfaces/roleSelectMenu";
import { getFilesAsSingleArray } from "@structures/getFiles";

const roleSelectMenusManager = async (client: BotClient, rootPath: string) => {
  const selectMenuFiles: string[] = getFilesAsSingleArray(`${rootPath}/interactions/roleSelectMenus`);
  selectMenuFiles.forEach((selectMenuFile: string) => {
    if (statSync(selectMenuFile).isDirectory()) return;
    const selectMenuCommand: IRoleSelectMenu = require(selectMenuFile).default;
    if (!selectMenuCommand || selectMenuCommand.ignore || !selectMenuCommand.name) return;

    client.roleSelectMenus.set(selectMenuCommand.name, selectMenuCommand);
  });
}

export default roleSelectMenusManager;
