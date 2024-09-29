import type { BotClient } from '@bot/classes';
import { stringSelectMenus } from '@bot/interactions/stringSelectMenus';

export const stringSelectMenusManager = async (client: BotClient) => {
  for (const stringSelectMenu of stringSelectMenus) {
    if (
      stringSelectMenu.ignore ||
      !stringSelectMenu.name ||
      !stringSelectMenu.execute
    )
      return;

    client.stringSelectMenus.set(stringSelectMenu.name, stringSelectMenu);
  }
};
