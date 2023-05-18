import { ChatInputCommandInteraction, EmbedBuilder, MessageComponentInteraction } from "discord.js";

import { IServer } from "@models/server.model";


const getServerOptionsEmbed = async (
server: IServer,
interaction: ChatInputCommandInteraction | MessageComponentInteraction,
prompt: string,
) => {
  const prefixes: string = (server.prefixes && server.prefixes.length > 0)
    ? server.prefixes.map(prefix => `\`${prefix}\``).join(", ")
    : '\`.\` (default)';
    
  const adminRoles: string = server.adminRoleIds
    ? `: ${(await Promise.all(server.adminRoleIds.map(async (roleId) => 
      interaction.guild?.roles.cache.get(roleId)
        || await interaction.guild?.roles.fetch(roleId)
        || roleId
    ))).join(", ")}`
    : "";
  
  return new EmbedBuilder()
    .setColor("Gold")
    .setTimestamp()
    .setAuthor({
      name: `${server.name} Server Options:`,
      iconURL: interaction.guild?.iconURL() || undefined
    })
    .setDescription(
      `${prompt ? ("**" + prompt + "**\n\n") : ""}`
      + `:one: Modify Message Command Prefixes: ${prefixes}`
      + `\n:two: ${server.adminRoleIds ? "Modify" : "Add"} Admin Roles${adminRoles}`
      + `\n:three: ${server.discoveryEnabled ? "Modify Server Discovery Settings" : "Enable Server Discovery"}`
    );
}

export default getServerOptionsEmbed;
