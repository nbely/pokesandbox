import {
  AutocompleteInteraction,
  CacheType,
  EmbedBuilder,
  Interaction,
  Message,
} from "discord.js";

import { AnyCommand } from "@structures/interfaces/baseCommand";
import { BotClient } from "@bot/index";

const getOnlyUsers = async (
  client: BotClient,
  message: Message | Exclude<Interaction, AutocompleteInteraction<CacheType>>,
  command: AnyCommand,
  isInteraction?: boolean,
): Promise<boolean> => {
  if (!command.onlyUsers || !Array.isArray(command.onlyUsers)) return true;
  const user = isInteraction
    ? (message as Interaction).user
    : (message as Message).author;
  if (command.onlyUsers.some((userId) => user.id == userId)) return true;
  else {
    if (command.returnErrors == false || command.returnOnlyUsersError == false)
      return false;
    const errorEmbed = new EmbedBuilder()
      .setColor("DarkRed")
      .setTimestamp()
      .setAuthor({
        name: user.tag,
        iconURL: user.displayAvatarURL(),
      })
      .setThumbnail(client.user?.displayAvatarURL() || null)
      .setDescription(
        `The command you tried to execute couldn't be ran as you are not one of the authorized users.`,
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

export default getOnlyUsers;
