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

const getAllUserPermissions = async (
  client: BotClient,
  message: Message | Exclude<Interaction, AutocompleteInteraction<CacheType>>,
  command: AnyCommand,
  isInteraction?: boolean,
): Promise<boolean> => {
  if (!command.allUserPermissions || !Array.isArray(command.allUserPermissions || !message.guild)) return true;
  const user = message.member as GuildMember;
  let missingPermissions: string[] = [];
  await command.allUserPermissions.forEach((permission: string) => {
    if (!user?.permissions.toArray().includes(<UserPermissions>permission)) missingPermissions.push(permission);
  });
  if (missingPermissions.length == 0) return true;
  else {
    if (command.returnErrors == false || command.returnAllUserPermissionsError == false) return false;
    const errorEmbed = new EmbedBuilder()
    .setColor("DarkRed")
    .setTimestamp()
    .setAuthor({
      name: user?.user.tag|| "",
      iconURL: user?.user.displayAvatarURL()
    })
    .setThumbnail(client.user?.displayAvatarURL() || null)
    .setDescription(`You are missing the set permissions which are necessary to run this command. Please acquire these permissions:\n${missingPermissions.map(permission => `↳ \`${permission}\``).join("\n")}`);

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

export default getAllUserPermissions;
