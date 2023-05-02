import { Client, StringSelectMenuInteraction } from "discord.js";
import { StringSelectMenuBuilder } from "@discordjs/builders";
import { join } from "path";
import { readdirSync } from "fs";

export interface StringSelectMenu {
  component: StringSelectMenuBuilder;
  customId: string;
  execute: (client: Client, interaction: StringSelectMenuInteraction) => void;
}

const getSelectMenus = (): StringSelectMenu[] => {
  const selectMenus: StringSelectMenu[] = [];
  const selectMenusDir: string = join(__dirname, "/interactions/stringSelectMenus");
  
  readdirSync(selectMenusDir).forEach(subDir => {
    readdirSync(join(selectMenusDir, subDir)).forEach(file => {
      if (!file.endsWith("ts")) {
        return;
      }

      const selectMenu: StringSelectMenu = require(`${selectMenusDir}/${subDir}/${file}`).default;
      selectMenus.push(selectMenu);
    });
  });
  
  return selectMenus;
};

export const stringSelectMenus: StringSelectMenu[] = getSelectMenus();
