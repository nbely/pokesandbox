import { Client } from "discord.js";

export default (client: Client): void => {
  client.once("ready", async () => {
    console.log(`${client?.user?.tag} is online`);
  });
};
