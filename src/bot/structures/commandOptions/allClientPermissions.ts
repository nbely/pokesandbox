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

const getAllClientPermissions = async (
  client: BotClient,
  message: Message | Exclude<Interaction, AutocompleteInteraction<CacheType>>,
  command: AnyCommand,
  isInteraction?: boolean,
): Promise<boolean> => {
  if (!command.allClientPermissions || !Array.isArray(command.allClientPermissions || !message.guild)) return true;
  const member = message.member as GuildMember;
  let missingPermissions: string[] = [];
  await command.allClientPermissions.forEach((permission: string) => {
    if (!message.guild?.members.me?.permissions.toArray().includes(<UserPermissions>permission)) missingPermissions.push(permission);
  });
  if (missingPermissions.length == 0) return true;
  else {
    if (command.returnErrors == false || command.returnAllClientPermissionsError == false) return false;
    const errorEmbed = new EmbedBuilder()
    .setColor("DarkRed")
    .setTimestamp()
    .setAuthor({
      name: member?.user.tag || "",
      iconURL: member?.user.displayAvatarURL()
    })
    .setThumbnail(client.user?.displayAvatarURL() || null)
    .setDescription(`The client is missing the set permissions which are necessary to run this command. Please provide the client these permissions to execute this command:\n${missingPermissions.map(permission => `↳ \`${permission}\``).join("\n")}`);

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

export default getAllClientPermissions;
