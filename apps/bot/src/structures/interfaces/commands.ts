import type {
  ButtonBuilder,
  ButtonInteraction,
  ContextMenuCommandBuilder,
  Message,
  MessageContextMenuCommandInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  RoleSelectMenuBuilder,
  RoleSelectMenuInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  UserContextMenuCommandInteraction,
  UserSelectMenuBuilder,
  UserSelectMenuInteraction,
} from 'discord.js';

import type { BotClient, Menu, Session } from '@bot/classes';

export interface IBaseCommand {
  allClientPermissions?: string[];
  allUserPermissions?: string[];
  anyClientPermissions?: string[];
  anyUserPermissions?: string[];
  channelCooldown?: number;
  globalCooldown?: number;
  guildCooldown?: number;
  ignore?: boolean;
  name: string;
  onlyChannels?: string[];
  onlyGuilds?: string[];
  onlyRoles?: string[] | ((guildId: string) => Promise<string[]>);
  onlyRolesOrAnyUserPermissions?: boolean;
  onlyUsers?: string[];
  ownerOnly?: boolean;
  returnAllClientPermissionsError?: boolean;
  returnAllUserPermissionsError?: boolean;
  returnAnyClientPermissionsError?: boolean;
  returnAnyUserPermissionsError?: boolean;
  returnChannelCooldownError?: boolean;
  returnErrors?: boolean;
  returnGlobalCooldownError?: boolean;
  returnGuildCooldownError?: boolean;
  returnOnlyChannelsError?: boolean;
  returnOnlyGuildsError?: boolean;
  returnOnlyRolesError?: boolean;
  returnOnlyUsersError?: boolean;
  returnOwnerOnlyError?: boolean;
}

export interface IButtonCommand extends IBaseCommand {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  create: (options?: any) => ButtonBuilder;
  execute?: (client: BotClient, interaction: ButtonInteraction) => void;
}

export interface IMessageCommand extends IBaseCommand {
  aliases?: string[];
  allowBots?: boolean;
  allowInDms?: boolean;
  execute: (client: BotClient, message: Message, args: string[]) => void;
}

export interface IMessageContextCommand extends IBaseCommand {
  command: ContextMenuCommandBuilder;
  execute: (
    client: BotClient,
    interaction: MessageContextMenuCommandInteraction
  ) => void;
}

export interface IModalForm extends IBaseCommand {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  create: (options?: any) => ModalBuilder;
  execute: (client: BotClient, interaction: ModalSubmitInteraction) => void;
}

export interface IRoleSelectMenu extends IBaseCommand {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  create: (options?: any) => RoleSelectMenuBuilder;
  execute?: (client: BotClient, interaction: RoleSelectMenuInteraction) => void;
}

export interface ISlashCommand extends IBaseCommand {
  command:
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  createMenu?: <T extends Menu>() => Promise<T>;
  execute?: (session: Session) => void;
}

export interface IStringSelectMenu extends IBaseCommand {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  create: (options?: any) => StringSelectMenuBuilder;
  execute: (
    client: BotClient,
    interaction: StringSelectMenuInteraction
  ) => void;
}

export interface IUserContextCommand extends IBaseCommand {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  command: ContextMenuCommandBuilder | any;
  execute: (
    client: BotClient,
    interaction: UserContextMenuCommandInteraction
  ) => void;
}

export interface IUserSelectMenu extends IBaseCommand {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  create: (options?: any) => UserSelectMenuBuilder;
  execute: (client: BotClient, interaction: UserSelectMenuInteraction) => void;
}

export type AnyCommand =
  | IButtonCommand
  | IMessageCommand
  | IMessageContextCommand
  | IModalForm
  | IRoleSelectMenu
  | ISlashCommand
  | IStringSelectMenu
  | IUserContextCommand
  | IUserSelectMenu;

export type ChatInputCommand =
  | IMessageContextCommand
  | ISlashCommand
  | IUserContextCommand;

export type GuildChatInputCommands = {
  id: string;
  messageContextCommands: IMessageContextCommand[];
  slashCommands: ISlashCommand[];
  userContextCommands: IUserContextCommand[];
};
