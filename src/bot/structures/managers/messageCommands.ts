import { statSync } from "fs";

import { BotClient } from "@bot/index";
import IMessageCommand from "@structures/interfaces/messageCommand";
import { getFilesAsSingleArray } from "@structures/getFiles";

const messageCommandsManager = async (client: BotClient, rootPath: string) => {
  const messageCommandsFiles: string[] = getFilesAsSingleArray(`${rootPath}/interactions/messageCommands`);
  messageCommandsFiles.forEach((messageCommandFile: string) => {
    if (statSync(messageCommandFile).isDirectory()) return;
    const messageCommand: IMessageCommand = require(messageCommandFile).default;
    if (messageCommand.ignore || !messageCommand.name || !messageCommand.execute) return;

    client.messageCommands.set(messageCommand.name, messageCommand);
    if (messageCommand.aliases && messageCommand.aliases.length > 0) {
      messageCommand.aliases.forEach((messageCommandAlias: string) => {
        client.messageCommandsAliases.set(messageCommandAlias, messageCommand.name);
      })
    }
  }); 
}

export default messageCommandsManager;
