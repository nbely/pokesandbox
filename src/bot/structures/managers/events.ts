import { statSync } from "fs";

import { BotClient } from "@bot/*";
import { getFilesAsSingleArray } from "@structures/getFiles";

export interface BotEvent {
  customEvent?: boolean;
  name: string;
  execute: (name: string, client?: BotClient, rootPath?: string) => void;
}

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
