import { EmbedBuilder, type GuildMember } from 'discord.js';
import type { Session } from '../session/Session';

/**
 * Default error handler that displays a red error embed.
 * Can be overridden via FlowCordConfig.onError
 */
export async function defaultErrorHandler(
  session: Session,
  error: unknown
): Promise<void> {
  let errorMessage = 'An unknown error has occurred!';

  if (error instanceof Error) {
    errorMessage = error.message;
  }

  const member = (session.componentInteraction?.member ??
    session.commandInteraction.member) as GuildMember | null;

  const errorEmbed = new EmbedBuilder()
    .setColor('DarkRed')
    .setAuthor({
      name: member?.user.username || 'Unknown User',
      iconURL: member?.user.displayAvatarURL(),
    })
    .setThumbnail(session.client.user?.displayAvatarURL() || null)
    .setTitle('Error')
    .setDescription(errorMessage)
    .setTimestamp();

  try {
    if (session.message) {
      await session.message.edit({
        embeds: [errorEmbed],
        components: [],
      });
    } else {
      // If no message exists yet, send a new one
      await session.commandInteraction.editReply({
        embeds: [errorEmbed],
        components: [],
      });
    }
  } catch (discordError) {
    // If Discord API call fails, log but don't throw
    console.error('Failed to send error message to user:', discordError);
  }
}
