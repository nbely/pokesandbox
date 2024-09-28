import { statSync } from "fs";

import { BotClient } from "@bot/index";
import { getFilesAsSingleArray } from "@structures/getFiles";

import IUserSelectMenu from "@structures/interfaces/userSelectMenu";

const userSelectMenusManager = async (client: BotClient, rootPath: string) => {
  const selectMenuFiles: string[] = getFilesAsSingleArray(
    `${rootPath}/interactions/userSelectMenus`,
  );
  for (const selectMenuFile of selectMenuFiles) {
    if (statSync(selectMenuFile).isDirectory()) return;
    const { default: selectMenuCommand }: { default: IUserSelectMenu } =
      await import(selectMenuFile);
    if (
      selectMenuCommand.ignore ||
      !selectMenuCommand.name ||
      !selectMenuCommand.execute
    )
      return;

    client.userSelectMenus.set(selectMenuCommand.name, selectMenuCommand);
  }
};

export default userSelectMenusManager;
