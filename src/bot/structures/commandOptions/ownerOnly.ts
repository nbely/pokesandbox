import {
  AutocompleteInteraction,
  CacheType,
  EmbedBuilder,
  Interaction,
  Message
} from "discord.js";

import { AnyCommand } from "@structures/interfaces/baseCommand";
import { BotClient } from "@bot/index";

const ownerIds: string[] = [process.env.OWNER_ID as string];

const getOwnerOnly = async (
  client: BotClient,
  message: Message | Exclude<Interaction, AutocompleteInteraction<CacheType>>,
  command: AnyCommand,
  isInteraction?: boolean,
): Promise<boolean> => {
  if (!command.ownerOnly || typeof command?.ownerOnly != "boolean") return true;
  const user = isInteraction ? (message as Interaction).user : (message as Message).author;
  if (ownerIds.includes(user.id)) return true;
  else {
    if (command.returnErrors == false || command.returnOwnerOnlyError == false) return false;
    const errorEmbed = new EmbedBuilder()
    .setColor("DarkRed")
    .setTimestamp()
    .setAuthor({
      name: user.tag,
      iconURL: user.displayAvatarURL()
    })
    .setThumbnail(client.user?.displayAvatarURL() || null)
    .setDescription("The command you tried to run is __restricted__ for the developers of this bot and thus the command failed to execute.");

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
  };
}

export default getOwnerOnly;
