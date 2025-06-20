import { Client, Collection } from 'discord.js';

import type {
  IBotEvent,
  IButtonCommand,
  IMessageCommand,
  IMessageContextCommand,
  IModalForm,
  IRoleSelectMenu,
  ISlashCommand,
  IStringSelectMenu,
  IUserContextCommand,
  IUserSelectMenu,
} from '@bot/structures/interfaces';

export class BotClient extends Client {
  buttons = new Collection<string, IButtonCommand>();
  events = new Collection<string, IBotEvent>();
  messageCommands = new Collection<string, IMessageCommand>();
  messageCommandsAliases = new Collection<string, string>();
  messageContextCommands = new Collection<string, IMessageContextCommand>();
  modalForms = new Collection<string, IModalForm>();
  roleSelectMenus = new Collection<string, IRoleSelectMenu>();
  slashCommands = new Collection<string, ISlashCommand>();
  stringSelectMenus = new Collection<string, IStringSelectMenu>();
  userContextCommands = new Collection<string, IUserContextCommand>();
  userSelectMenus = new Collection<string, IUserSelectMenu>();
}
