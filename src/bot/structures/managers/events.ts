import { statSync } from "fs";

import { BotClient } from "@bot/*";
import BotEvent from "@structures/interfaces/botEvent";
import { getFilesAsSingleArray } from "@structures/getFiles";

const eventsManager = async (client: BotClient, rootPath: string) => {
  const clientEventsFiles = getFilesAsSingleArray(`${rootPath}/events`);
  clientEventsFiles.forEach((eventFile: string) => {
    if (statSync(eventFile).isDirectory()) return;
    const clientEvent: BotEvent = require(eventFile).default;
    if (!clientEvent.name || !clientEvent.execute) return;

    client.events.set(clientEvent.name, clientEvent);
    if (clientEvent.customEvent) return clientEvent.execute(clientEvent.name, client, rootPath);

    clientEvent.execute(clientEvent.name, client, rootPath);
  });
}

export default eventsManager;
