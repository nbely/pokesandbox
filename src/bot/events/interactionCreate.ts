import {
  ApplicationCommandType,
  CommandInteraction,
  Interaction,
  InteractionType, 
  MessageComponentInteraction,
  ModalSubmitInteraction
} from "discord.js";

import { BotClient } from "@bot/index";
import { BotEvent } from "@structures/managers/events";
import { ButtonCommand } from "@structures/managers/buttons";
import { MessageContextCommand, SlashCommand, UserContextCommand } from "@structures/managers/slashCommands";
import { ModalForm } from "@structures/managers/modalForms";
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
      if (interaction.type === InteractionType.ModalSubmit) {
        await handleModalSubmitInteraction(client, interaction);
      }
    });
  },
};

const handleSlashCommand = async (client: BotClient, interaction: CommandInteraction): Promise<void> => {
  if (interaction.isChatInputCommand()) {
    const slashCommand = client.slashCommands.get(interaction.commandName) as SlashCommand | undefined;
    if (!slashCommand || slashCommand.command.type !== ApplicationCommandType.ChatInput) {
      interaction.reply({ content: "An error has ocurred", ephemeral: true });
      return;
    }
    slashCommand.execute(client, interaction);
  }

  if (interaction.isMessageContextMenuCommand()) {
    const messageContextMenuCommand = client.slashCommands.get(interaction.commandName) as MessageContextCommand | undefined;
    if (!messageContextMenuCommand || messageContextMenuCommand.command.type !== ApplicationCommandType.Message) {
      interaction.reply({ content: "An error has ocurred", ephemeral: true });
      return;
    }
    messageContextMenuCommand.execute(client, interaction);
  }

  if (interaction.isUserContextMenuCommand()) {
    const userContextCommand = client.slashCommands.get(interaction.commandName) as UserContextCommand | undefined;
    if (!userContextCommand || userContextCommand.command.type !== ApplicationCommandType.User) {
      interaction.reply({ content: "An error has ocurred", ephemeral: true });
      return;
    }
    userContextCommand.execute(client, interaction);
  }
}

const handleMessageInteraction = async (client: BotClient, interaction: MessageComponentInteraction): Promise<void> => {
  if (interaction.isButton()) {
    const button: ButtonCommand | undefined = 
      client.buttons.get(interaction.customId);
    if (!button) {
      interaction.reply({ content: "An error has ocurred", ephemeral: true });
      return;
    }
    button.execute(client, interaction);
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

const handleModalSubmitInteraction = async (client: BotClient, interaction: ModalSubmitInteraction): Promise<void> => {
  if (!interaction.isModalSubmit()) return;
  
  const modalForm: ModalForm | undefined = 
    client.modalForms.get(interaction.customId);
  if (!modalForm) {
    interaction.reply({ content: "An error has ocurred", ephemeral: true });
    return;
  }
  modalForm.execute(client, interaction);
}

export default InteractionCreate;
