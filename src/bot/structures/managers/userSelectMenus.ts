import { Client, UserSelectMenuInteraction } from "discord.js";
import { UserSelectMenuBuilder } from "@discordjs/builders";
import { join } from "path";
import { readdirSync } from "fs";

export interface UserSelectMenu {
  component: UserSelectMenuBuilder;
  customId: string;
  execute: (client: Client, interaction: UserSelectMenuInteraction) => void;
}

const getSelectMenus = (): UserSelectMenu[] => {
  const selectMenus: UserSelectMenu[] = [];
  const selectMenusDir: string = join(__dirname, "../../interactions/stringSelectMenus");
  
  readdirSync(selectMenusDir).forEach(subDir => {
    readdirSync(join(selectMenusDir, subDir)).forEach(file => {
      if (!file.endsWith("ts")) {
        return;
      }

      const selectMenu: UserSelectMenu = require(`${selectMenusDir}/${subDir}/${file}`).default;
      selectMenus.push(selectMenu);
    });
  });
  
  return selectMenus;
};

export const userSelectMenus: UserSelectMenu[] = getSelectMenus();
