import type { BotClient } from '@bot/classes';
import { roleSelectMenus } from '@bot/interactions/roleSelectMenus';

export const roleSelectMenusManager = async (client: BotClient) => {
  for (const roleSelectMenu of roleSelectMenus) {
    if (!roleSelectMenu || roleSelectMenu.ignore || !roleSelectMenu.name)
      return;

    client.roleSelectMenus.set(roleSelectMenu.name, roleSelectMenu);
  }
};
