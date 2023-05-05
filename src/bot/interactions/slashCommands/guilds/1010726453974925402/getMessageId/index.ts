import {
  ApplicationCommandType,
  Client,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
} from "discord.js";

import { MessageContextCommand } from "@structures/managers/slashCommands";

const Initialize: MessageContextCommand = {
  command: new ContextMenuCommandBuilder()
    .setName("get_id")
    .setType(ApplicationCommandType.Message),
  execute: async (client: Client, interaction: MessageContextMenuCommandInteraction) => {    
    await interaction.deferReply({ephemeral: true});
    const id: string =  interaction.targetId;

    await interaction.followUp({
        ephemeral: true,
        content: `The message id is ${id}.`
    });
  },
};

export default Initialize;
