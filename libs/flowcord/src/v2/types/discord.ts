/**
 * FlowCord-specific Discord.js union aliases used throughout v2.
 */
import type {
  AnySelectMenuInteraction,
  ChannelSelectMenuBuilder,
  ChatInputCommandInteraction,
  MentionableSelectMenuBuilder,
  MessageComponentInteraction,
  ModalSubmitInteraction,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
} from 'discord.js';

/**
 * Any select-menu builder (excludes button builders).
 */
export type AnySelectMenuBuilder =
  | ChannelSelectMenuBuilder
  | MentionableSelectMenuBuilder
  | RoleSelectMenuBuilder
  | StringSelectMenuBuilder
  | UserSelectMenuBuilder;

/**
 * Union type for component interactions (buttons and select menus).
 */
export type ComponentInteraction =
  | MessageComponentInteraction
  | AnySelectMenuInteraction;

/**
 * Union of all interaction types a session may encounter.
 */
export type AnySessionInteraction =
  | ChatInputCommandInteraction
  | MessageComponentInteraction
  | AnySelectMenuInteraction
  | ModalSubmitInteraction;
