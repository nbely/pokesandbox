import { statSync } from "fs";

import { BotClient } from "@bot/index";
import { getFilesAsSingleArray } from "@structures/getFiles";

import IMessageCommand from "@structures/interfaces/messageCommand";

const messageCommandsManager = async (client: BotClient, rootPath: string) => {
  const messageCommandsFiles: string[] = getFilesAsSingleArray(
    `${rootPath}/interactions/messageCommands`,
  );
  for (const messageCommandFile of messageCommandsFiles) {
    if (statSync(messageCommandFile).isDirectory()) return;
    const { default: messageCommand }: { default: IMessageCommand } =
      await import(messageCommandFile);
    if (
      messageCommand.ignore ||
      !messageCommand.name ||
      !messageCommand.execute
    )
      return;

    client.messageCommands.set(messageCommand.name, messageCommand);
    if (messageCommand.aliases && messageCommand.aliases.length > 0) {
      messageCommand.aliases.forEach((messageCommandAlias: string) => {
        client.messageCommandsAliases.set(
          messageCommandAlias,
          messageCommand.name,
        );
      });
    }
  }
};

export default messageCommandsManager;
