import { EmbedBuilder, GuildMember } from "discord.js";
import { BotClient } from "..";

const buildErrorEmbed = (
  client: BotClient,
  member: GuildMember | null,
  description: string
): EmbedBuilder => {
  return new EmbedBuilder()
    .setTitle("Error")
    .setColor("DarkRed")
    .setTimestamp()
    .setAuthor({
      name: member?.user.tag || "",
      iconURL: member?.user.displayAvatarURL()
    })
    .setThumbnail(client.user?.displayAvatarURL() || null)
    .setDescription(`${description}\n\nPlease try again and reach out to the support channel on the official [PokeSandbox Server](https://discord.gg/2BDghKaGQu) if the issue persists.`);
}

export default buildErrorEmbed;
