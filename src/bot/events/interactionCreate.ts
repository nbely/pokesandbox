import {
  ApplicationCommandType,
  CommandInteraction,
  Interaction,
  InteractionType, 
  MessageComponentInteraction,
  ModalSubmitInteraction
} from "discord.js";

import { BotClient } from "@bot/index";
import IBotEvent from "@structures/interfaces/botEvent";
import IButtonCommand from "@structures/interfaces/buttonCommand";
import IMessageContextCommand from "@structures/interfaces/messageContextCommand";
import IModalForm from "@structures/interfaces/modalForm";
import ISlashCommand from "@structures/interfaces/slashCommand";
import IStringSelectMenu from "@structures/interfaces/stringSelectMenu";
import IUserContextCommand from "@structures/interfaces/userContextCommand";
import IUserSelectMenu from "@structures/interfaces/userSelectMenu";

const InteractionCreate: IBotEvent = {
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
    const slashCommand = client.slashCommands.get(interaction.commandName) as ISlashCommand | undefined;
    if (!slashCommand || slashCommand.command.type !== ApplicationCommandType.ChatInput) {
      interaction.reply({ content: "An error has ocurred", ephemeral: true });
      return;
    }
    slashCommand.execute(client, interaction);
  }

  if (interaction.isMessageContextMenuCommand()) {
    const messageContextMenuCommand = client.slashCommands.get(interaction.commandName) as IMessageContextCommand | undefined;
    if (!messageContextMenuCommand || messageContextMenuCommand.command.type !== ApplicationCommandType.Message) {
      interaction.reply({ content: "An error has ocurred", ephemeral: true });
      return;
    }
    messageContextMenuCommand.execute(client, interaction);
  }

  if (interaction.isUserContextMenuCommand()) {
    const userContextCommand = client.slashCommands.get(interaction.commandName) as IUserContextCommand | undefined;
    if (!userContextCommand || userContextCommand.command.type !== ApplicationCommandType.User) {
      interaction.reply({ content: "An error has ocurred", ephemeral: true });
      return;
    }
    userContextCommand.execute(client, interaction);
  }
}

const handleMessageInteraction = async (client: BotClient, interaction: MessageComponentInteraction): Promise<void> => {
  if (interaction.isButton()) {
    const button: IButtonCommand | undefined = 
      client.buttons.get(interaction.customId);
    if (!button) {
      interaction.reply({ content: "An error has ocurred", ephemeral: true });
      return;
    }
    button.execute(client, interaction);
  }

  if (interaction.isStringSelectMenu()) {
    const stringSelectMenu: IStringSelectMenu | undefined = 
      client.stringSelectMenus.get(interaction.customId);
    if (!stringSelectMenu) {
      interaction.reply({ content: "An error has ocurred", ephemeral: true });
      return;
    }
    stringSelectMenu.execute(client, interaction);
  }

  if (interaction.isUserSelectMenu()) {
    const userSelectMenu: IUserSelectMenu | undefined = 
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
  
  const modalForm: IModalForm | undefined = 
    client.modalForms.get(interaction.customId);
  if (!modalForm) {
    interaction.reply({ content: "An error has ocurred", ephemeral: true });
    return;
  }
  modalForm.execute(client, interaction);
}

export default InteractionCreate;
