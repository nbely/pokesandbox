import {
  AutocompleteInteraction,
  CacheType,
  EmbedBuilder,
  Interaction,
  Message
} from "discord.js";

import { AnyCommand } from "@structures/interfaces/baseCommand";
import { BotClient } from "@bot/index";

const getGlobalCooldown = async (
  client: BotClient,
  message: Message | Exclude<Interaction, AutocompleteInteraction<CacheType>>,
  command: AnyCommand,
  isInteraction: boolean,
  interactionType: string,
): Promise<boolean> => {
  return true;
  // if (!command.globalCooldown || isNaN(command.globalCooldown)) return true;
  // const user = isInteraction ? (message as Interaction).user : (message as Message).author;
  // const currentTime = Date.now();
  // const oldTime = await globalCooldownDB.get(`${interactionType}.${command.name}.${user.id}`);
  // if (Math.floor(currentTime - (oldTime ?? 0)) >= command.globalCooldown || isNaN(oldTime)) {
  //   await globalCooldownDB.set(`${interactionType}.${command.name}.${user.id}`, currentTime);
  //   return true;
  // } else {
  //   if (command.returnErrors == false || command.returnGlobalCooldownError == false) return false;
  //   const errorEmbed = new EmbedBuilder()
  //   .setColor("DarkRed")
  //   .setTimestamp()
  //   .setAuthor({
  //     name: user.tag,
  //     iconURL: user.displayAvatarURL()
  //   })
  //   .setThumbnail(client.user?.displayAvatarURL() || null)
  //   .setDescription(`You are currently at cooldown. Please try again in <t:${Math.floor(Math.floor(oldTime + command.globalCooldown) / 1000)}:R>.`);

  //   message.reply({
  //     embeds: [errorEmbed]
  //   });
  //   return false;
  // };
}

export default getGlobalCooldown;
