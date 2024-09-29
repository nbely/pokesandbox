import type { BotClient } from '@bot/classes';

import { events } from '../../events';

export const eventsManager = async (client: BotClient) => {
  for (const event of events) {
    if (event.ignore || !event.name || !event.execute) return;

    client.events.set(event.name, event);
    event.execute(event.name, client);
  }
};
