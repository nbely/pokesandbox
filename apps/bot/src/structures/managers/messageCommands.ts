import type { BotClient } from '@bot/classes';
import { messageCommands } from '@bot/interactions/messageCommands';

export const messageCommandsManager = async (client: BotClient) => {
  for (const messageCommand of messageCommands) {
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
          messageCommand.name
        );
      });
    }
  }
};
