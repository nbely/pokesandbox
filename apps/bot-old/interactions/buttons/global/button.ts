import { ButtonBuilder, ButtonStyle } from "discord.js";

import IButtonCommand from "@structures/interfaces/buttonCommand";

const Button: IButtonCommand = {
  name: "global-button",
  create: (options: {
    label: string;
    style: ButtonStyle;
    id?: number | string;
  }) => {
    return new ButtonBuilder()
      .setCustomId(
        `global-button_${
          options.id !== undefined ? options.id : options.label
        }`,
      )
      .setLabel(options.label)
      .setStyle(options.style);
  },
};

export default Button;
