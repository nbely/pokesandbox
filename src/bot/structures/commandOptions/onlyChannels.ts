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

const getOnlyChannels = async (
  client: BotClient,
  message: Message | Exclude<Interaction, AutocompleteInteraction<CacheType>>,
  command: AnyCommand,
  isInteraction?: boolean,
): Promise<boolean> => {
  if (!command.onlyChannels || !Array.isArray(command.onlyChannels || !message.guild)) return true;
  const member = message.member as GuildMember;
  if (command.onlyChannels.some(channelId => message.channel?.id == channelId)) return true;
  else {
    if (command.returnErrors == false || command.returnOnlyChannelsError == false) return false;
    const errorEmbed = new EmbedBuilder()
    .setColor("DarkRed")
    .setTimestamp()
    .setAuthor({
      name: member?.user.tag || "",
      iconURL: member?.user.displayAvatarURL()
    })
    .setThumbnail(client.user?.displayAvatarURL() || null)
    .setDescription(`The command you tried to execute cannot be ran in the current channel. Please execute the command in of these authorized channels:\n${command.onlyChannels.map(channelId => `↳ <#${channelId}>`).join("\n")}`);

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

export default getOnlyChannels;
