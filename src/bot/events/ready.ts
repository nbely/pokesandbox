import { ActivityType } from "discord.js";
import { statSync } from "fs";

import { BotClient } from "@bot/index";
import { BotEvent } from "@structures/managers/events";
import { getFilesAsSingleArray } from "@structures/getFiles";
import { SlashCommand } from "@structures/managers/slashCommands";

const Ready: BotEvent = {
  name: "ready",
  execute: (name: string, client?: BotClient, rootPath?: string) => {
    if (!client) return;
    client.once(name, async () => {
      client?.user?.setActivity("Training.", {
        type: ActivityType.Watching
      });

      let allSlashCommands = 0;
      
      const slashCommandsTotalFiles = getFilesAsSingleArray(`${rootPath}/interactions/slashCommands`);
      slashCommandsTotalFiles.forEach((cmdFile: string) => {
          if (statSync(cmdFile).isDirectory()) return;
          const slashCmd: SlashCommand = require(cmdFile).default;
          if (!slashCmd.command.name || !slashCmd.execute) return;
          else allSlashCommands++;
      });

      console.log("----------------------------------------------------");
      console.log(`[Client] Logged into ${client?.user?.tag}`);
      // if (client.messageCommands.size > 0) console.log(chalk.red("[MessageCommands] ") + chalk.cyanBright(`Loaded ${client.messageCommands.size} MessageCommands with ${chalk.white(`${client.messageCommandsAliases.size} Aliases`)}.`));
      if (client.events.size > 0) console.log(`[Events] Loaded ${client.events.size} Events.`);
      // if (client.buttonCommands.size > 0) console.log(chalk.whiteBright("[ButtonCommands] ") + chalk.greenBright(`Loaded ${client.buttonCommands.size} Buttons.`));
      if (client.stringSelectMenus.size > 0) console.log(`[StringSelectMenus] Loaded ${client.stringSelectMenus.size} StringSelectMenus.`);
      if (client.userSelectMenus.size > 0) console.log(`[UserSelectMenus] Loaded ${client.userSelectMenus.size} UserSelectMenus.`);
      // if (client.modalForms.size > 0) console.log(chalk.cyanBright("[ModalForms] ") + chalk.yellowBright(`Loaded ${client.modalForms.size} Modals.`));
      if (allSlashCommands > 0) console.log(`[SlashCommands] Loaded ${allSlashCommands} SlashCommands.`);
      console.log("----------------------------------------------------");
    });
  },
};

export default Ready;
