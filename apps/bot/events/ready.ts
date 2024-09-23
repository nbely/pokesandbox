import { ActivityType } from "discord.js";
import { statSync } from "fs";

import { BotClient } from "@bot/index";
import { getFilesAsSingleArray } from "@structures/getFiles";

import IBotEvent from "@structures/interfaces/botEvent";
import ISlashCommand from "@structures/interfaces/slashCommand";

const Ready: IBotEvent = {
  name: "ready",
  execute: (name: string, client?: BotClient, rootPath?: string) => {
    if (!client) return;
    client.once(name, async () => {
      client?.user?.setActivity("Training Videos.", {
        type: ActivityType.Watching,
      });

      let allSlashCommands = 0;

      const slashCommandsTotalFiles = getFilesAsSingleArray(
        `${rootPath}/interactions/slashCommands`,
        undefined,
        "index.ts",
      );
      for (const cmdFile of slashCommandsTotalFiles) {
        if (statSync(cmdFile).isDirectory()) return;
        const { default: slashCmd }: { default: ISlashCommand } = await import(
          cmdFile
        );
        if (!slashCmd.name || !slashCmd.execute) return;
        else allSlashCommands++;
      }

      console.log("----------------------------------------------------");
      console.log(`[Client] Logged into ${client?.user?.tag}`);
      if (client.events.size > 0)
        console.log(`[Events] Loaded ${client.events.size} Events.`);
      if (client.buttons.size > 0)
        console.log(`[ButtonCommands] Loaded ${client.buttons.size} Buttons.`);
      if (client.messageCommands.size > 0)
        console.log(
          `[MessageCommands] Loaded ${client.messageCommands.size} MessageCommands with ${client.messageCommandsAliases.size} Aliases`,
        );
      if (client.modalForms.size > 0)
        console.log(`[ModalForms] Loaded ${client.modalForms.size} Modals.`);
      if (client.roleSelectMenus.size > 0)
        console.log(
          `[RoleSelectMenus] Loaded ${client.roleSelectMenus.size} RoleSelectMenus.`,
        );
      if (allSlashCommands > 0)
        console.log(
          `[SlashCommands] Loaded ${allSlashCommands} SlashCommands.`,
        );
      if (client.stringSelectMenus.size > 0)
        console.log(
          `[StringSelectMenus] Loaded ${client.stringSelectMenus.size} StringSelectMenus.`,
        );
      if (client.userSelectMenus.size > 0)
        console.log(
          `[UserSelectMenus] Loaded ${client.userSelectMenus.size} UserSelectMenus.`,
        );
      console.log("----------------------------------------------------");
    });
  },
};

export default Ready;
