import {
  type AutocompleteInteraction,
  type CacheType,
  EmbedBuilder,
  type GuildMember,
  type Interaction,
  type Message,
} from 'discord.js';

import type { BotClient } from '@bot/classes';

import type { AnyCommand, UserPermissions } from '../interfaces';

const getAnyClientPermissions = async (
  client: BotClient,
  message: Message | Exclude<Interaction, AutocompleteInteraction<CacheType>>,
  command: AnyCommand,
  isInteraction?: boolean
): Promise<boolean> => {
  if (
    !command.anyClientPermissions ||
    !message.guild ||
    !Array.isArray(command.anyClientPermissions) ||
    !message.guild
  )
    return true;
  const member = message.member as GuildMember;
  if (
    command.anyClientPermissions.some((permission: string) =>
      message.guild?.members.me?.permissions
        .toArray()
        .includes(<UserPermissions>permission)
    )
  )
    return true;
  else {
    if (
      command.returnErrors == false ||
      command.returnAnyClientPermissionsError == false
    )
      return false;
    const errorEmbed = new EmbedBuilder()
      .setColor('DarkRed')
      .setTimestamp()
      .setAuthor({
        name: member?.user.tag || '',
        iconURL: member?.user.displayAvatarURL(),
      })
      .setThumbnail(client.user?.displayAvatarURL() || null)
      .setDescription(
        `The client is missing any one of these permissions which are necessary to run this command. Please provide the client any one of these permissions to execute this command:\n${command.anyClientPermissions
          .map((permission) => `↳ \`${permission}\``)
          .join('\n')}`
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

export default getAnyClientPermissions;
