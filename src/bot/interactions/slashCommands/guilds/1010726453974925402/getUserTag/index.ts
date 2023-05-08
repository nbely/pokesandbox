import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  GuildMember,
  UserContextMenuCommandInteraction,
} from "discord.js";

import { BotClient } from "@bot/index";
import IUserContextCommand from "@structures/interfaces/userContextCommand";

const GetUserTag: IUserContextCommand = {
  name: "get-user-tag",
  command: new ContextMenuCommandBuilder()
    .setName("get-user-tag")
    .setType(ApplicationCommandType.User),
  execute: async (client: BotClient, interaction: UserContextMenuCommandInteraction) => {    
    await interaction.deferReply({ephemeral: true});
    const member: GuildMember | undefined = interaction.guild?.members.cache.get(interaction.targetId);

    await interaction.followUp({
        ephemeral: true,
        content: `That is ${member?.user.tag}.`
    });
  },
};

export default GetUserTag;
