import { statSync } from "fs";

import { BotClient } from "@bot/index";
import { getFilesAsSingleArray } from "@structures/getFiles";

import IStringSelectMenu from "@structures/interfaces/stringSelectMenu";

const stringSelectMenusManager = async (
  client: BotClient,
  rootPath: string,
) => {
  const selectMenuFiles: string[] = getFilesAsSingleArray(
    `${rootPath}/interactions/stringSelectMenus`,
  );
  for (const selectMenuFile of selectMenuFiles) {
    if (statSync(selectMenuFile).isDirectory()) return;
    const { default: selectMenuCommand }: { default: IStringSelectMenu } =
      await import(selectMenuFile);
    if (
      selectMenuCommand.ignore ||
      !selectMenuCommand.name ||
      !selectMenuCommand.execute
    )
      return;

    client.stringSelectMenus.set(selectMenuCommand.name, selectMenuCommand);
  }
};

export default stringSelectMenusManager;
