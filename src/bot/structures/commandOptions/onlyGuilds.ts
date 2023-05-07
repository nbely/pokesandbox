import { AutocompleteInteraction, CacheType, EmbedBuilder, GuildMember, Interaction, Message } from "discord.js";

import { AnyCommand } from "@structures/interfaces/baseCommand";
import { BotClient } from "@bot/index";

const getOnlyGuilds = async (
  client: BotClient,
  message: Message | Exclude<Interaction, AutocompleteInteraction<CacheType>>,
  command: AnyCommand,
  isInteraction?: boolean,
): Promise<boolean> => {
  if (!command.onlyGuilds || !Array.isArray(command.onlyGuilds || !message.guild)) return true;
    const member = message.member as GuildMember;
  if (command.onlyGuilds.some(guildId => message.guild?.id == guildId)) return true;
  else {
    if (command.returnErrors == false || command.returnOnlyGuildsError == false) return false;
    const errorEmbed = new EmbedBuilder()
    .setColor("DarkRed")
    .setTimestamp()
    .setAuthor({
      name: member?.user.tag || "",
      iconURL: member?.user.displayAvatarURL()
    })
    .setThumbnail(client.user?.displayAvatarURL() || null)
    .setDescription(`The command you tried to execute cannot be ran in the current guild. Please execute the command in of these authorized guilds:\n${command.onlyGuilds.map(guildId => `↳ \`${client.guilds.cache.get(guildId)?.name}\``).join("\n")}`);

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

export default getOnlyGuilds;
