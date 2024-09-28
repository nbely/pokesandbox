import { statSync } from "fs";

import { BotClient } from "@bot/index";
import { getFilesAsSingleArray } from "@structures/getFiles";

import IBotEvent from "@structures/interfaces/botEvent";

const eventsManager = async (client: BotClient, rootPath: string) => {
  const clientEventsFiles = getFilesAsSingleArray(`${rootPath}/events`);
  for (const eventFile of clientEventsFiles) {
    if (statSync(eventFile).isDirectory()) return;
    const { default: clientEvent }: { default: IBotEvent } = await import(
      eventFile
    );
    if (clientEvent.ignore || !clientEvent.name || !clientEvent.execute) return;

    client.events.set(clientEvent.name, clientEvent);
    clientEvent.execute(clientEvent.name, client, rootPath);
  }
};

export default eventsManager;
