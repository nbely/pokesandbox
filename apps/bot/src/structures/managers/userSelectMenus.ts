import type { BotClient } from '@bot/classes';
import { userSelectMenus } from '@bot/interactions/userSelectMenus';

export const userSelectMenusManager = async (client: BotClient) => {
  for (const userSelectMenu of userSelectMenus) {
    if (
      userSelectMenu.ignore ||
      !userSelectMenu.name ||
      !userSelectMenu.execute
    )
      return;

    client.userSelectMenus.set(userSelectMenu.name, userSelectMenu);
  }
};
