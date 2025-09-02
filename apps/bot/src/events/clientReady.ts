import { ActivityType } from 'discord.js';

import type { BotClient } from '@bot/classes';
import type { IBotEvent } from '@bot/structures/interfaces';

export const ClientReady: IBotEvent = {
  name: 'clientReady',
  execute: (name: string, client?: BotClient) => {
    if (!client) return;
    client.once(name, async () => {
      client?.user?.setActivity('Training Videos.', {
        type: ActivityType.Watching,
      });

      console.log('----------------------------------------------------');
      console.log(`[Client] Logged into ${client?.user?.tag}`);
      if (client.events.size > 0)
        console.log(`[Events] Loaded ${client.events.size} Events.`);
      if (client.buttons.size > 0)
        console.log(`[ButtonCommands] Loaded ${client.buttons.size} Buttons.`);
      if (client.messageContextCommands.size > 0)
        console.log(
          `[MessageContextCommands] Loaded ${client.messageContextCommands.size} MessageContextCommands.`
        );
      if (client.messageCommands.size > 0)
        console.log(
          `[MessageCommands] Loaded ${client.messageCommands.size} MessageCommands with ${client.messageCommandsAliases.size} Aliases`
        );
      if (client.modalForms.size > 0)
        console.log(`[ModalForms] Loaded ${client.modalForms.size} Modals.`);
      if (client.roleSelectMenus.size > 0)
        console.log(
          `[RoleSelectMenus] Loaded ${client.roleSelectMenus.size} RoleSelectMenus.`
        );
      if (client.slashCommands.size > 0)
        console.log(
          `[SlashCommands] Loaded ${client.slashCommands.size} SlashCommands.`
        );
      if (client.stringSelectMenus.size > 0)
        console.log(
          `[StringSelectMenus] Loaded ${client.stringSelectMenus.size} StringSelectMenus.`
        );
      if (client.userContextCommands.size > 0)
        console.log(
          `[UserContextCommands] Loaded ${client.userContextCommands.size} UserContextCommands.`
        );
      if (client.userSelectMenus.size > 0)
        console.log(
          `[UserSelectMenus] Loaded ${client.userSelectMenus.size} UserSelectMenus.`
        );
      console.log('----------------------------------------------------');
    });
  },
};
