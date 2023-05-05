import {
  ApplicationCommandType,
  Client,
  GuildMember,
  UserContextMenuCommandInteraction,
} from "discord.js";
import { ContextMenuCommandBuilder, SlashCommandBuilder } from "@discordjs/builders";

import { UserContextCommand } from "@structures/managers/slashCommands";

const Initialize: UserContextCommand = {
  command: new ContextMenuCommandBuilder()
    .setName("get_tag")
    .setType(ApplicationCommandType.User),
  execute: async (client: Client, interaction: UserContextMenuCommandInteraction) => {    
    await interaction.deferReply({ephemeral: true});
    const member: GuildMember | undefined = interaction.guild?.members.cache.get(interaction.targetId);

    await interaction.followUp({
        ephemeral: true,
        content: `That is ${member?.user.tag}.`
    });
  },
};

export default Initialize;
