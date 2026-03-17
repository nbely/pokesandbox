/**
 * Example 01 — Quick Start
 *
 * Bare-bones FlowCord setup with a single slash command in a brand new bot.
 * This is the minimum code needed to get a FlowCord menu working.
 *
 * Slash command: /weather
 * Shows the current weather for a fictional city and lets the user refresh it.
 *
 * Prerequisites:
 *   npm install discord.js @flowcord/core
 *   Set DISCORD_BOT_TOKEN environment variable
 *   Register the /weather slash command with Discord (see bottom of file)
 */

import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonStyle,
  REST,
  Routes,
  SlashCommandBuilder,
} from 'discord.js';
import { FlowCord, MenuBuilder, closeMenu } from '@flowcord/core';

// --- Fake data ---
const weatherConditions = [
  '☀️ Sunny',
  '🌧️ Rainy',
  '⛈️ Stormy',
  '🌤️ Partly Cloudy',
  '❄️ Snowy',
];

function getRandomWeather() {
  const condition =
    weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
  const temp = Math.floor(Math.random() * 35) + 5; // 5–40°C
  return { condition, temp };
}

// --- Bot setup ---
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const flowcord = new FlowCord({ client });

// --- Register the menu ---
flowcord.registerMenu('weather', (session) =>
  new MenuBuilder(session, 'weather')
    .setup((ctx) => {
      // Initialize state with random weather
      const weather = getRandomWeather();
      ctx.state.set('condition', weather.condition);
      ctx.state.set('temp', weather.temp);
    })
    .setEmbeds((ctx) => [
      new EmbedBuilder()
        .setTitle('🌍 Weather Report — Cerulean City')
        .setDescription(
          `**Condition:** ${ctx.state.get('condition')}\n` +
            `**Temperature:** ${ctx.state.get('temp')}°C`
        )
        .setColor(0x3498db)
        .setFooter({ text: 'Press Refresh to check again' })
        .setTimestamp(),
    ])
    .setButtons(() => [
      {
        label: '🔄 Refresh',
        style: ButtonStyle.Primary,
        action: async (ctx) => {
          const weather = getRandomWeather();
          ctx.state.set('condition', weather.condition);
          ctx.state.set('temp', weather.temp);
          // No navigation — menu re-renders automatically with new state
        },
      },
      {
        label: 'Close',
        style: ButtonStyle.Secondary,
        action: closeMenu(),
      },
    ])
    .setCancellable() // Adds a Cancel button
    .build()
);

// --- Interaction handler ---
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'weather') {
      await flowcord.handleInteraction(interaction, 'weather');
    }
  } else if (interaction.isMessageComponent()) {
    flowcord.routeComponentInteraction(interaction);
  }
});

// --- Login ---
client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);

// ---------------------------------------------------------------------------
// Slash command registration (run once)
// ---------------------------------------------------------------------------
// Uncomment and run this section once to register your slash command:
//
// const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!);
// const commands = [
//   new SlashCommandBuilder()
//     .setName('weather')
//     .setDescription('Check the weather in Cerulean City')
//     .toJSON(),
// ];
// rest.put(Routes.applicationCommands(process.env.APP_ID!), { body: commands })
//   .then(() => console.log('Slash commands registered'))
//   .catch(console.error);
