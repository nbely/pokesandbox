import { EmbedBuilder } from "discord.js";

import { AdminMenu } from "@bot/classes/adminMenu";

const getCreateFirstRegionEmbed = (menu: AdminMenu): EmbedBuilder => {
  return new EmbedBuilder()
    .setColor("Gold")
    .setTimestamp()
    .setAuthor({
      name: `Let's create your first region!!`,
      iconURL: menu.commandInteraction.guild?.iconURL() || undefined,
    })
    .setDescription(
      `Hello! It appears that this is your first region that you are creating on this server. I'll start by asking, what is the name of your new region?` +
      `\n\nOnce you've decided, you'll be able to use the \`/regions\` command to update your region's settings, and the \`/map\` command to start managing the settings for your region!` +
      `\n\nRegions settings that are required before being able to deploy your region live will be bolded and italicized until they have satisfied the minimum requirements.` +
      `\n\nIf you need any help, you can always use the \`/help\` command to get a list of all available commands, refer to to official PokéSandbox setup guide (https://pokesandbox.com/setup), or use the \`/support\` command to get a link to the support server.` +
      `\n\nAnd last but not least, have fun! We look forward to seeing what you create!`        
    );
};

export default getCreateFirstRegionEmbed;
