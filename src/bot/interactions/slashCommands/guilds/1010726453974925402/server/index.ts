import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

import { BotClient } from "@bot/index";
import { IServer } from "@models/server.model";
import ISlashCommand from "@structures/interfaces/slashCommand";
import { createServer, findServer } from "@services/server.service";
import ServerOption from "@interactions/buttons/server/option";

const Server: ISlashCommand = {
  name: "server",
  command: new SlashCommandBuilder()
    .setName("server")
    .setDescription("Update your PokeSandbox server settings")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),
  execute: async (client: BotClient, interaction: ChatInputCommandInteraction | ButtonInteraction) => {    
    let server: IServer | null = await findServer({ serverId: interaction.guild?.id});

    await interaction.deferReply();

    if (!interaction.guild) return;
    if (!server) {
      server = await createServer({
        serverId: interaction.guild.id,
        icon: interaction.guild.icon || undefined,
        name: interaction.guild.name,
        playerList: [],
      });
      
      const initializedEmbed = new EmbedBuilder()
        .setColor("Gold")
        .setTimestamp()
        .setAuthor({
          name: `${server.name} Initialized!`,
          iconURL: interaction.guild?.iconURL() || undefined
        })
        .setDescription(
          `Congratulations, your server has been initialized with PokeSandbox!
          
          Below are some basic commands that will be helpful for getting your server setup and starting with creating your first region:
          \n\`/server\`: Use this command at any time to open up the below options menu and update your PokeSandbox server settings.
          \n\`/regions\`: Use this command to create a new region for your server, or to update existing regions.`
        );

      await interaction.followUp({
        embeds: [initializedEmbed],
      });
    }

    const components = [
      new ActionRowBuilder<ButtonBuilder>()
      .addComponents(ServerOption.create({label: '1', style: ButtonStyle.Primary}))
      .addComponents(ServerOption.create({label: '2', style: ButtonStyle.Primary}))
      .addComponents(ServerOption.create({label: '3', style: ButtonStyle.Primary}))
      .addComponents(ServerOption.create({label: 'Cancel', style: ButtonStyle.Secondary}))
    ];

    const prefixes = (server.prefixes && server.prefixes.length > 0)
      ? server.prefixes.map(prefix => `\`${prefix}\``).join(', ')
      : '\`.\` (default)';

    const settingsEmbed = new EmbedBuilder()
      .setColor("Gold")
      .setTimestamp()
      .setAuthor({
        name: `${server.name} Options:`,
        iconURL: interaction.guild?.iconURL() || undefined
      })
      .setDescription(
        `:one: Modify Message Command Prefixes: ${prefixes}
        :two: ${server.description ? 'Modify' : 'Add'} Server Description
        :three: ${server.discoveryEnabled ? 'Disable' : 'Enable'} Server Discovery`
      );

    await interaction.followUp({
      components,
      embeds: [settingsEmbed],
    });
  },
};

export default Server;
