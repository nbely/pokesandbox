import {
  ApplicationCommandType,
  type CommandInteraction,
  type Interaction,
  InteractionType,
  type MessageComponentInteraction,
  type ModalSubmitInteraction,
} from 'discord.js';

import type { BotClient } from '@bot/classes';
import { commandOptionsProcessor } from '@bot/structures/commandOptions/processor';
import type {
  IBotEvent,
  IButtonCommand,
  IMessageContextCommand,
  IModalForm,
  IRoleSelectMenu,
  ISlashCommand,
  IStringSelectMenu,
  IUserContextCommand,
  IUserSelectMenu,
} from '@bot/structures/interfaces';

import { createSession, Session } from '../classes/Session/Session';

export const InteractionCreate: IBotEvent = {
  name: 'interactionCreate',
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

const handleApplicationCommandInteraction = async (
  client: BotClient,
  interaction: CommandInteraction
): Promise<void> => {
  if (interaction.isChatInputCommand()) {
    const slashCommand: ISlashCommand | undefined = client.slashCommands.get(
      interaction.commandName
    );

    if (!slashCommand || slashCommand.ignore) {
      interaction.reply({
        content: 'Error: Slash Command not found.',
        ephemeral: true,
      });
      return;
    }

    const authenticatedCMDOptions = await commandOptionsProcessor(
      client,
      interaction,
      slashCommand,
      true,
      'SlashCommand'
    );

    if (authenticatedCMDOptions) {
      return createSession(Session, client, interaction, slashCommand.name);
    }
  }

  if (interaction.isMessageContextMenuCommand()) {
    const messageContextMenuCommand: IMessageContextCommand | undefined =
      client.messageContextCommands.get(interaction.commandName);

    if (
      !messageContextMenuCommand ||
      messageContextMenuCommand.command.type !== ApplicationCommandType.Message
    ) {
      interaction.reply({ content: 'An error has ocurred', ephemeral: true });
      return;
    }

    const authenticatedCMDOptions = await commandOptionsProcessor(
      client,
      interaction,
      messageContextMenuCommand,
      true,
      'MessageContextMenuCommand'
    );

    if (authenticatedCMDOptions) {
      return messageContextMenuCommand.execute(client, interaction);
    }
  }

  if (interaction.isUserContextMenuCommand()) {
    const userContextMenuCommand: IUserContextCommand | undefined =
      client.userContextCommands.get(interaction.commandName);

    if (
      !userContextMenuCommand ||
      userContextMenuCommand.command.type !== ApplicationCommandType.User
    ) {
      interaction.reply({ content: 'An error has ocurred', ephemeral: true });
      return;
    }

    const authenticatedCMDOptions = await commandOptionsProcessor(
      client,
      interaction,
      userContextMenuCommand,
      true,
      'UserContextCommand'
    );

    if (authenticatedCMDOptions) {
      return userContextMenuCommand.execute(client, interaction);
    }
  }
};

const handleMessageComponentInteraction = async (
  client: BotClient,
  interaction: MessageComponentInteraction
): Promise<void> => {
  if (interaction.isButton()) {
    const button: IButtonCommand | undefined =
      client.buttons.get(interaction.customId) ||
      client.buttons.get(interaction.customId.split('_')[0]);

    if (!button) return;

    const authenticatedCMDOptions = await commandOptionsProcessor(
      client,
      interaction,
      button,
      true,
      'Button'
    );

    if (!button.execute) return;
    if (authenticatedCMDOptions) return button.execute(client, interaction);
  }

  if (interaction.isRoleSelectMenu()) {
    const roleSelectMenu: IRoleSelectMenu | undefined =
      client.roleSelectMenus.get(interaction.customId);

    if (!roleSelectMenu) return;

    const authenticatedCMDOptions = await commandOptionsProcessor(
      client,
      interaction,
      roleSelectMenu,
      true,
      'RoleSelectMenu'
    );

    if (!roleSelectMenu.execute) return;
    if (authenticatedCMDOptions)
      return roleSelectMenu.execute(client, interaction);
  }

  if (interaction.isStringSelectMenu()) {
    const stringSelectMenu: IStringSelectMenu | undefined =
      client.stringSelectMenus.get(interaction.customId);

    if (!stringSelectMenu) return;

    const authenticatedCMDOptions = await commandOptionsProcessor(
      client,
      interaction,
      stringSelectMenu,
      true,
      'StringSelectMenu'
    );

    if (authenticatedCMDOptions)
      return stringSelectMenu.execute(client, interaction);
  }

  if (interaction.isUserSelectMenu()) {
    const userSelectMenu: IUserSelectMenu | undefined =
      client.userSelectMenus.get(interaction.customId);

    if (!userSelectMenu) return;

    const authenticatedCMDOptions = await commandOptionsProcessor(
      client,
      interaction,
      userSelectMenu,
      true,
      'UserSelectMenu'
    );
    if (authenticatedCMDOptions)
      return userSelectMenu.execute(client, interaction);
  }
};

const handleModalSubmitInteraction = async (
  client: BotClient,
  interaction: ModalSubmitInteraction
): Promise<void> => {
  if (!interaction.isModalSubmit()) return;

  const modalForm: IModalForm | undefined = client.modalForms.get(
    interaction.customId
  );
  if (!modalForm) return;

  const authenticatedCMDOptions = await commandOptionsProcessor(
    client,
    interaction,
    modalForm,
    true,
    'ModalForm'
  );
  if (authenticatedCMDOptions) return modalForm.execute(client, interaction);
};
