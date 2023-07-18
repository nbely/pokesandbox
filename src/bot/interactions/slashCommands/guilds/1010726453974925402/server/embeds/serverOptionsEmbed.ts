import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageComponentInteraction,
} from "discord.js";

import { IServerMenu } from "../interfaces/menu";

const getServerOptionsEmbed = async (
  interaction: ChatInputCommandInteraction | MessageComponentInteraction,
  menu: IServerMenu,
) => {
  const prefixes: string = (menu.server.prefixes && menu.server.prefixes.length > 0)
    ? menu.server.prefixes.map(prefix => `\`${prefix}\``).join(", ")
    : '\`.\` (default)';
    
  const adminRolesList: string = menu.adminRoles
    ? menu.adminRoles?.join(", ")
    : "None";

  const modRolesList: string = menu.modRoles
    ? menu.modRoles?.join(", ")
    : "None";
  
  return new EmbedBuilder()
    .setColor("Gold")
    .setTimestamp()
    .setAuthor({
      name: `${menu.server.name} Server Options:`,
      iconURL: interaction.guild?.iconURL() || undefined
    })
    .setDescription(
      `${menu.prompt ? ("**" + menu.prompt + "**\n\n") : ""}`
      + `:one: Update Bot Prefixes: ${prefixes}`
      + `\n:two: Update Admin Roles: ${adminRolesList}`
      + `\n:three: Update Mod Roles: ${modRolesList}`
      + `\n:four: ${menu.server.discovery.enabled ? "Modify Server Discovery Settings" : "Enable Server Discovery"}`
    );
};

export default getServerOptionsEmbed;
