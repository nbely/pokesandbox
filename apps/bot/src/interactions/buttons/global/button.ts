import { ButtonBuilder, ButtonStyle } from 'discord.js';

import type { IButtonCommand } from '@bot/structures/interfaces';

export const Button: IButtonCommand = {
  name: 'global-button',
  create: (options: {
    label: string;
    style: ButtonStyle;
    id?: number | string;
  }) => {
    return new ButtonBuilder()
      .setCustomId(
        `global-button_${options.id !== undefined ? options.id : options.label}`
      )
      .setLabel(options.label)
      .setStyle(options.style);
  },
};
