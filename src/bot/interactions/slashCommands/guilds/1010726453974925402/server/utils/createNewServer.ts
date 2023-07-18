import { ChatInputCommandInteraction, Guild } from "discord.js";

import { createServer } from "@services/server.service";

const createNewServer = async (interaction: ChatInputCommandInteraction) => {
  const guild = interaction.guild as Guild;
  return await createServer({
    serverId: guild.id,
    discovery: {
      enabled: false,
      icon: guild.icon || undefined,
    },
    name: guild.name,
    playerList: [],
  });
};

export default createNewServer;
