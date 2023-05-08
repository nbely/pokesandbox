import {
  ApplicationCommandType,
  CommandInteraction,
  Interaction,
  InteractionType, 
  MessageComponentInteraction,
  ModalSubmitInteraction
} from "discord.js";

import { BotClient } from "@bot/index";
import commandOptionsProcessor from "@structures/commandOptions/processor";

import IBotEvent from "@structures/interfaces/botEvent";
import IButtonCommand from "@structures/interfaces/buttonCommand";
import IMessageContextCommand from "@structures/interfaces/messageContextCommand";
import IModalForm from "@structures/interfaces/modalForm";
import IRoleSelectMenu from "@bot/structures/interfaces/roleSelectMenu";
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
        await handleApplicationCommandInteraction(client, interaction);
      }
      if (interaction.type === InteractionType.MessageComponent) {
        await handleMessageComponentInteraction(client, interaction);
      }
      if (interaction.type === InteractionType.ModalSubmit) {
        await handleModalSubmitInteraction(client, interaction);
      }
    });
  },
};

const handleApplicationCommandInteraction = async (client: BotClient, interaction: CommandInteraction): Promise<void> => {
  if (interaction.isChatInputCommand()) {
    const slashCommand = client.slashCommands.get(interaction.commandName) as ISlashCommand | undefined;
    if (!slashCommand || slashCommand.ignore) {
      interaction.reply({ content: "Error: Slash Command not found.", ephemeral: true });
      return;
    }
    const authenticatedCMDOptions = await commandOptionsProcessor(client, interaction, slashCommand, true, "SlashCommand");
    if (authenticatedCMDOptions) return slashCommand.execute(client, interaction);
  }

  if (interaction.isMessageContextMenuCommand()) {
    const messageContextMenuCommand = client.slashCommands.get(interaction.commandName) as IMessageContextCommand | undefined;
    if (!messageContextMenuCommand || messageContextMenuCommand.command.type !== ApplicationCommandType.Message) {
      interaction.reply({ content: "An error has ocurred", ephemeral: true });
      return;
    }
    const authenticatedCMDOptions = await commandOptionsProcessor(client, interaction, messageContextMenuCommand, true, "MessageContextMenuCommand");
    if (authenticatedCMDOptions) return messageContextMenuCommand.execute(client, interaction);
  }

  if (interaction.isUserContextMenuCommand()) {
    const userContextMenuCommand = client.slashCommands.get(interaction.commandName) as IUserContextCommand | undefined;
    if (!userContextMenuCommand || userContextMenuCommand.command.type !== ApplicationCommandType.User) {
      interaction.reply({ content: "An error has ocurred", ephemeral: true });
      return;
    }
    const authenticatedCMDOptions = await commandOptionsProcessor(client, interaction, userContextMenuCommand, true, "UserContextCommand");
    if (authenticatedCMDOptions) return userContextMenuCommand.execute(client, interaction);
  }
}

const handleMessageComponentInteraction = async (client: BotClient, interaction: MessageComponentInteraction): Promise<void> => {
  if (interaction.isButton()) {
    const button: IButtonCommand | undefined = 
      client.buttons.get(interaction.customId.split('_')[0]);
    if (!button) {
      interaction.reply({ content: "An error has ocurred", ephemeral: true });
      return;
    }
    const authenticatedCMDOptions = await commandOptionsProcessor(client, interaction, button, true, "Button");
    if (authenticatedCMDOptions) return button.execute(client, interaction);
  }

  if (interaction.isRoleSelectMenu()) {
    const roleSelectMenu: IRoleSelectMenu | undefined = 
      client.roleSelectMenus.get(interaction.customId);
    if (!roleSelectMenu) {
      interaction.reply({ content: "An error has ocurred", ephemeral: true });
      return;
    }
    const authenticatedCMDOptions = await commandOptionsProcessor(client, interaction, roleSelectMenu, true, "RoleSelectMenu");
    if (authenticatedCMDOptions) return roleSelectMenu.execute(client, interaction);
  }

  if (interaction.isStringSelectMenu()) {
    const stringSelectMenu: IStringSelectMenu | undefined = 
      client.stringSelectMenus.get(interaction.customId);
    if (!stringSelectMenu) {
      interaction.reply({ content: "An error has ocurred", ephemeral: true });
      return;
    }
    const authenticatedCMDOptions = await commandOptionsProcessor(client, interaction, stringSelectMenu, true, "StringSelectMenu");
    if (authenticatedCMDOptions) return stringSelectMenu.execute(client, interaction);
  }

  if (interaction.isUserSelectMenu()) {
    const userSelectMenu: IUserSelectMenu | undefined = 
      client.userSelectMenus.get(interaction.customId);
    if (!userSelectMenu) {
      interaction.reply({ content: "An error has ocurred", ephemeral: true });
      return;
    }
    const authenticatedCMDOptions = await commandOptionsProcessor(client, interaction, userSelectMenu, true, "UserSelectMenu");
    if (authenticatedCMDOptions) return userSelectMenu.execute(client, interaction);
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
  const authenticatedCMDOptions = await commandOptionsProcessor(client, interaction, modalForm, true, "ModalForm");
    if (authenticatedCMDOptions) return modalForm.execute(client, interaction);
}

export default InteractionCreate;
