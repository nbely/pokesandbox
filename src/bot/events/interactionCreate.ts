import {
  Client,
  CommandInteraction,
  Interaction,
  InteractionType, 
  MessageComponentInteraction
} from "discord.js";

import { stringSelectMenus } from "../structures/managers/stringSelectMenus";
import { userSelectMenus } from "../structures/managers/userSelectMenus";
import { BotClient } from "@bot/index";

export default (client: BotClient): void => {
  client.on("interactionCreate", async (interaction: Interaction) => {
    if (interaction.type === InteractionType.ApplicationCommand) {
      await handleSlashCommand(client, interaction);
    }
    if (interaction.type === InteractionType.MessageComponent) {
      await handleMessageInteraction(client, interaction);
    }
  });
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
    const stringSelectMenu = stringSelectMenus.find(menu => menu.customId === interaction.customId);
    if (!stringSelectMenu) {
      interaction.reply({ content: "An error has ocurred", ephemeral: true });
      return;
    }
    stringSelectMenu.execute(client, interaction);
  }

  if (interaction.isUserSelectMenu()) {
    const userSelectMenu = userSelectMenus.find(menu => menu.customId === interaction.customId);
    if (!userSelectMenu) {
      interaction.reply({ content: "An error has ocurred", ephemeral: true });
      return;
    }
    userSelectMenu.execute(client, interaction);
  }
}