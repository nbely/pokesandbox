import { statSync } from "fs";

import { BotClient } from "@bot/index";
import { getFilesAsSingleArray } from "@structures/getFiles";

import IRoleSelectMenu from "@structures/interfaces/roleSelectMenu";

const roleSelectMenusManager = async (client: BotClient, rootPath: string) => {
  const selectMenuFiles: string[] = getFilesAsSingleArray(
    `${rootPath}/interactions/roleSelectMenus`,
  );
  for (const selectMenuFile of selectMenuFiles) {
    if (statSync(selectMenuFile).isDirectory()) return;
    const { default: selectMenuCommand }: { default: IRoleSelectMenu } =
      await import(selectMenuFile);
    if (
      !selectMenuCommand ||
      selectMenuCommand.ignore ||
      !selectMenuCommand.name
    )
      return;

    client.roleSelectMenus.set(selectMenuCommand.name, selectMenuCommand);
  }
};

export default roleSelectMenusManager;
