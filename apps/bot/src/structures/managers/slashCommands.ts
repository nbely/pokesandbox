import {
  REST,
  RESTPostAPIApplicationCommandsJSONBody,
  Routes,
} from 'discord.js';

import type { BotClient } from '@bot/classes';
import { guildChatInputCommands as guilds } from '@bot/interactions/guilds';
import { globalMessageContextCommands } from '@bot/interactions/messageContextCommands';
import { globalSlashCommands } from '@bot/interactions/slashCommands';
import { globalUserContextCommands } from '@bot/interactions/userContextCommands';

import type { GuildChatInputCommands } from '../interfaces';

const CLIENT_ID = process.env.DISCORD_CLIENT_ID as string;
const TOKEN = process.env.DISCORD_BOT_TOKEN as string;

export const slashCommandsManager = async (client: BotClient) => {
  const rest = new REST({ version: '10' }).setToken(TOKEN);

  if (
    globalMessageContextCommands?.length ||
    globalSlashCommands?.length ||
    globalUserContextCommands?.length
  ) {
    const globalChatInputCommands: RESTPostAPIApplicationCommandsJSONBody[] =
      [];

    for (const mCtxCommand of globalMessageContextCommands) {
      if (mCtxCommand.ignore || !mCtxCommand.command || !mCtxCommand.execute)
        return;
      client.messageContextCommands.set(mCtxCommand.command.name, mCtxCommand);
      globalChatInputCommands.push(mCtxCommand.command.toJSON());
    }

    for (const uCtxCommand of globalUserContextCommands) {
      if (uCtxCommand.ignore || !uCtxCommand.command || !uCtxCommand.execute)
        return;
      client.userContextCommands.set(uCtxCommand.command.name, uCtxCommand);
      globalChatInputCommands.push(uCtxCommand.command.toJSON());
    }

    for (const slashCommand of globalSlashCommands) {
      if (
        slashCommand.ignore ||
        !slashCommand.command ||
        !slashCommand.createMenu
      )
        return;
      client.slashCommands.set(slashCommand.command.name, slashCommand);
      globalChatInputCommands.push(slashCommand.command.toJSON());
    }

    try {
      // TODO: Uncomment this line when tested/finished commands have been made global
      // await rest.put(Routes.applicationCommands(CLIENT_ID), { body: globalSlashCommands });
    } catch (error) {
      console.log(error);
    }
  }

  if (guilds?.length > 0) {
    guilds.forEach(async (guild: GuildChatInputCommands) => {
      const guildChatInputCommands: RESTPostAPIApplicationCommandsJSONBody[] =
        [];

      for (const mCtxCmd of guild.messageContextCommands) {
        if (mCtxCmd.ignore || !mCtxCmd.command || !mCtxCmd.execute) continue;
        client.messageContextCommands.set(mCtxCmd.command.name, mCtxCmd);

        guildChatInputCommands.push(mCtxCmd.command.toJSON());
      }

      for (const uCtxCmd of guild.userContextCommands) {
        if (uCtxCmd.ignore || !uCtxCmd.command || !uCtxCmd.execute) continue;
        client.userContextCommands.set(uCtxCmd.command.name, uCtxCmd);

        guildChatInputCommands.push(uCtxCmd.command.toJSON());
      }

      for (const slashCmd of guild.slashCommands) {
        if (slashCmd.ignore || !slashCmd.command || !slashCmd.createMenu)
          continue;
        client.slashCommands.set(slashCmd.command.name, slashCmd);

        guildChatInputCommands.push(slashCmd.command.toJSON());
      }

      try {
        if (guildChatInputCommands.length > 0) {
          await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guild.id), {
            body: guildChatInputCommands,
          });
        }
      } catch (error) {
        console.log(error);
      }
    });
  }
};
