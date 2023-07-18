import {
  AutocompleteInteraction,
  CacheType,
  EmbedBuilder,
  GuildMember,
  Interaction,
  Message
} from "discord.js";

import { AnyCommand } from "@structures/interfaces/baseCommand";
import { BotClient } from "@bot/index";
import UserPermissions from "@structures/interfaces/permissions";

const getAnyUserPermissions = async (
  client: BotClient,
  message: Message | Exclude<Interaction, AutocompleteInteraction<CacheType>>,
  command: AnyCommand,
  isInteraction?: boolean,
): Promise<boolean> => {
  if (!command.anyUserPermissions || !message.guild || !Array.isArray(command.anyUserPermissions)) return true;
  const member = message.member as GuildMember;
  if (command.anyUserPermissions.some((permission: string) => member?.permissions.toArray().includes(<UserPermissions>permission))) return true;
  else {
    if (command.returnErrors == false || command.returnAnyUserPermissionsError == false) return false;
    const errorEmbed = new EmbedBuilder()
    .setColor("DarkRed")
    .setTimestamp()
    .setAuthor({
      name: member?.user.tag || "",
      iconURL: member?.user.displayAvatarURL()
    })
    .setThumbnail(client.user?.displayAvatarURL() || null)
    .setDescription(`You are missing any one of these permissions which are necessary to run this command. Please acquire any one of these permissions to execute this command:\n${command.anyUserPermissions.map(permission => `↳ \`${permission}\``).join("\n")}`);

    if (isInteraction) {
      (message as Exclude<Interaction, AutocompleteInteraction<CacheType>>)
        .reply({
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
}

export default getAnyUserPermissions;
