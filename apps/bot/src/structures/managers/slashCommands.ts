import { REST, Routes } from 'discord.js';

import type { BotClient } from '@bot/classes';
import {
  slashCommands,
  type GuildSlashCommands,
} from '@bot/interactions/slashCommands';

import type { ChatInputCommand } from '../interfaces';

const CLIENT_ID = process.env.DISCORD_CLIENT_ID as string;
const TOKEN = process.env.DISCORD_BOT_TOKEN as string;

export const slashCommandsManager = async (client: BotClient) => {
  const { guildSlashCommands: guilds, globalSlashCommands } = slashCommands;

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  if (globalSlashCommands?.length > 0) {
    const globalSlashCommands: ChatInputCommand[] = [];
    for (const slashCommand of globalSlashCommands) {
      if (slashCommand.ignore || !slashCommand.command || !slashCommand.execute)
        return;
      client.slashCommands.set(slashCommand.command.name, slashCommand);
      globalSlashCommands.push(slashCommand.command.toJSON());
    }
    try {
      // TODO: Uncomment this line when tested/finished commands have been made global
      // await rest.put(Routes.applicationCommands(CLIENT_ID), { body: globalSlashCommands });
    } catch (error) {
      console.log(error);
    }
  }

  if (guilds?.length > 0) {
    guilds.forEach(async (guild: GuildSlashCommands) => {
      const guildSlashCommands: ChatInputCommand[] = [];

      for (const slashCommand of guild.commands) {
        if (
          slashCommand.ignore ||
          !slashCommand.command ||
          !slashCommand.execute
        )
          continue;
        client.slashCommands.set(slashCommand.command.name, slashCommand);

        guildSlashCommands.push(slashCommand.command.toJSON());
      }
      try {
        if (guildSlashCommands.length > 0) {
          await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guild.id), {
            body: guildSlashCommands,
          });
        }
      } catch (error) {
        console.log(error);
      }
    });
  }
};
