import type {
  AnySelectMenuInteraction,
  MessageComponentInteraction,
} from 'discord.js';

export type ComponentInteraction =
  | MessageComponentInteraction
  | AnySelectMenuInteraction;
