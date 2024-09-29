import type { BotClient } from '@bot/classes';
import { buttons } from '@bot/interactions/buttons';

export const buttonsManager = async (client: BotClient) => {
  for (const button of buttons) {
    if (!button || button.ignore || !button.name) return;

    client.buttons.set(button.name, button);
  }
};
