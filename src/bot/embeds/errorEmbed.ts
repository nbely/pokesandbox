import { EmbedBuilder, GuildMember } from "discord.js";
import { BotClient } from "../index";

/**
 * Builds an embed for reporting a command error to the user.
 * @param {BotClient} client The Bot Client utilized.
 * @param {GuildMember | null} member Guild Member who experienced the error, if any.
 * @param {string} description Description of the error experienced.
 * @param {boolean} addSupportInfo Flag to add a message for contacting support.
 * @returns {EmbedBuilder} Returns an EmbedBuilder object for use in an interaction response.
 */
const buildErrorEmbed = (
  client: BotClient,
  member: GuildMember | null,
  description: string,
  addSupportInfo: boolean = false,
): EmbedBuilder => {
  return new EmbedBuilder()
    .setColor("DarkRed")
    .setAuthor({
      name: member?.user.username || "",
      iconURL: member?.user.displayAvatarURL(),
    })
    .setThumbnail(client.user?.displayAvatarURL() || null)
    .setTitle("Error")
    .setDescription(
      `${description}` +
        `${
          addSupportInfo
            ? "\n\nPlease try again and reach out to the support channel on the official [PokeSandbox Server](https://discord.gg/2BDghKaGQu) if the issue persists."
            : ""
        }`,
    )
    .setTimestamp();
};

export default buildErrorEmbed;
