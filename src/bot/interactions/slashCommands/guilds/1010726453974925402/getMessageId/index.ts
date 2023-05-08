import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
} from "discord.js";

import { BotClient } from "@bot/index";
import IMessageContextCommand from "@structures/interfaces/messageContextCommand";

const GetMessageId: IMessageContextCommand = {
  name: "get-message-id",
  command: new ContextMenuCommandBuilder()
    .setName("get-message-id")
    .setType(ApplicationCommandType.Message),
  execute: async (client: BotClient, interaction: MessageContextMenuCommandInteraction) => {    
    await interaction.deferReply({ephemeral: true});
    const id: string =  interaction.targetId;

    await interaction.followUp({
        ephemeral: true,
        content: `The message id is ${id}.`
    });
  },
};

export default GetMessageId;
