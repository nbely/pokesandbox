import { ButtonBuilder, ButtonStyle } from "discord.js";

import IButtonCommand from "@structures/interfaces/buttonCommand";

const ServerOption: IButtonCommand = {
  name: "server-option",
  create: (options: {
    label: string;
    style: ButtonStyle;
    id?: number | string;
  }) => {
    return new ButtonBuilder()
      .setCustomId(
        `server-option_${
          options.id !== undefined ? options.id : options.label
        }`,
      )
      .setLabel(options.label)
      .setStyle(options.style);
  },
};

export default ServerOption;
