import {
  AutocompleteInteraction,
  CacheType,
  EmbedBuilder,
  GuildMember,
  Interaction,
  Message,
} from "discord.js";

import { AnyCommand } from "@structures/interfaces/baseCommand";
import { BotClient } from "@bot/index";

const getOnlyRoles = async (
  client: BotClient,
  message: Message | Exclude<Interaction, AutocompleteInteraction<CacheType>>,
  command: AnyCommand,
  isInteraction?: boolean,
): Promise<boolean> => {
  /* eslint-disable prefer-const */
  let onlyRoles: string[];
  if (!command.onlyRoles || !message.guildId || !message.member) return true;
  onlyRoles = Array.isArray(command.onlyRoles)
    ? command.onlyRoles
    : await command.onlyRoles(message.guildId);
  const member = message.member as GuildMember;
  if (onlyRoles.some((roleId) => member?.roles.cache.has(roleId))) return true;
  else {
    if (command.returnErrors == false || command.returnOnlyRolesError == false)
      return false;
    const errorEmbed = new EmbedBuilder()
      .setColor("DarkRed")
      .setTimestamp()
      .setAuthor({
        name: member?.user.tag || "",
        iconURL: member?.user.displayAvatarURL(),
      })
      .setThumbnail(client.user?.displayAvatarURL() || null)
      .setDescription(
        `The command you tried to execute couldn't be executed as you are missing one of these required roles:\n${onlyRoles
          .map((roleId) => `↳ <@&${roleId}>`)
          .join("\n")}`,
      );

    if (isInteraction) {
      (
        message as Exclude<Interaction, AutocompleteInteraction<CacheType>>
      ).reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });
    } else {
      (message as Message).reply({
        embeds: [errorEmbed],
      });
    }
    return false;
  }
};

export default getOnlyRoles;
