import {
  CommandInteraction,
  Interaction,
  InteractionType, 
  MessageComponentInteraction
} from "discord.js";

import { BotClient } from "@bot/index";
import { BotEvent } from "@structures/managers/events";
import { StringSelectMenu } from "@structures/managers/stringSelectMenus";
import { UserSelectMenu } from "@structures/managers/userSelectMenus";

const InteractionCreate: BotEvent = {
  name: "interactionCreate",
  execute: (name: string, client?: BotClient) => {
    if (!client) return;
    client.on(name, async (interaction: Interaction) => {
      if (interaction.type === InteractionType.ApplicationCommand) {
        await handleSlashCommand(client, interaction);
      }
      if (interaction.type === InteractionType.MessageComponent) {
        await handleMessageInteraction(client, interaction);
      }
    });
  },
};

const handleSlashCommand = async (client: BotClient, interaction: CommandInteraction): Promise<void> => {
  if (!interaction.isChatInputCommand()) return;

  const slashCommand = client.slashCommands.get(interaction.commandName);
  if (!slashCommand) {
    interaction.reply({ content: "An error has ocurred", ephemeral: true });
    return;
  }

  slashCommand.execute(client, interaction);
}

const handleMessageInteraction = async (client: BotClient, interaction: MessageComponentInteraction): Promise<void> => {
  if (interaction.isButton()) {
    console.log("Button Interaction received!");
  }

  if (interaction.isStringSelectMenu()) {
    const stringSelectMenu: StringSelectMenu | undefined = 
      client.stringSelectMenus.get(interaction.customId);
    if (!stringSelectMenu) {
      interaction.reply({ content: "An error has ocurred", ephemeral: true });
      return;
    }
    stringSelectMenu.execute(client, interaction);
  }

  if (interaction.isUserSelectMenu()) {
    const userSelectMenu: UserSelectMenu | undefined = 
      client.userSelectMenus.get(interaction.customId);
    if (!userSelectMenu) {
      interaction.reply({ content: "An error has ocurred", ephemeral: true });
      return;
    }
    userSelectMenu.execute(client, interaction);
  }
}

export default InteractionCreate;
