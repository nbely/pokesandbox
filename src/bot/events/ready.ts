import { ActivityType } from "discord.js";
import { statSync } from "fs";

import { BotClient } from "@bot/index";
import IBotEvent from "@structures/interfaces/botEvent";
import ISlashCommand from "@structures/interfaces/slashCommand";
import { getFilesAsSingleArray } from "@structures/getFiles";

const Ready: IBotEvent = {
  name: "ready",
  execute: (name: string, client?: BotClient, rootPath?: string) => {
    if (!client) return;
    client.once(name, async () => {
      client?.user?.setActivity("Training.", {
        type: ActivityType.Watching
      });

      let allSlashCommands = 0;
      
      const slashCommandsTotalFiles = getFilesAsSingleArray(`${rootPath}/interactions/slashCommands`, undefined, "index.ts");
      slashCommandsTotalFiles.forEach((cmdFile: string) => {
        if (statSync(cmdFile).isDirectory()) return;
        const slashCmd: ISlashCommand = require(cmdFile).default;
        if (!slashCmd.name || !slashCmd.execute) return;
        else allSlashCommands++;
      });
``
      console.log("----------------------------------------------------");
      console.log(`[Client] Logged into ${client?.user?.tag}`);
      // if (client.messageCommands.size > 0) console.log(chalk.red("[MessageCommands] ") + chalk.cyanBright(`Loaded ${client.messageCommands.size} MessageCommands with ${chalk.white(`${client.messageCommandsAliases.size} Aliases`)}.`));
      if (client.events.size > 0) console.log(`[Events] Loaded ${client.events.size} Events.`);
      if (client.buttons.size > 0) console.log(`[ButtonCommands] Loaded ${client.buttons.size} Buttons.`);
      if (client.roleSelectMenus.size > 0) console.log(`[RoleSelectMenus] Loaded ${client.roleSelectMenus.size} RoleSelectMenus.`);
      if (client.stringSelectMenus.size > 0) console.log(`[StringSelectMenus] Loaded ${client.stringSelectMenus.size} StringSelectMenus.`);
      if (client.userSelectMenus.size > 0) console.log(`[UserSelectMenus] Loaded ${client.userSelectMenus.size} UserSelectMenus.`);
      if (client.modalForms.size > 0) console.log(`[ModalForms] Loaded ${client.modalForms.size} Modals.`);
      if (allSlashCommands > 0) console.log(`[SlashCommands] Loaded ${allSlashCommands} SlashCommands.`);
      console.log("----------------------------------------------------");
    });
  },
};

export default Ready;
