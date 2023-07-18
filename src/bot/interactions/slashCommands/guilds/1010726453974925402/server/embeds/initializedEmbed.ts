import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

import { IServer } from "@models/server.model";

const getInitializedEmbed = (server: IServer, interaction: ChatInputCommandInteraction) => {
  return new EmbedBuilder()
    .setColor("Gold")
    .setTimestamp()
    .setAuthor({
      name: `${server.name} Initialized!`,
      iconURL: interaction.guild?.iconURL() || undefined
    })
    .setDescription(
      `Congratulations, your server has been initialized with PokeSandbox!\n`
      + `\nBelow are some basic commands that will be helpful for getting your server setup and starting with creating your first region:`
      + `\n\`/server\`: Use this command at any time to open up the below options menu and update your PokeSandbox server settings.`
      + `\n\`/regions\`: Use this command to create a new region for your server, or to update existing regions.`
    );
}

export default getInitializedEmbed;
