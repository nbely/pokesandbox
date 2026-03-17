/**
 * Example 02 — Multi-Menu Navigation
 *
 * Demonstrates multiple menus with forward/back navigation.
 *
 * Slash command: /cookbook
 * Flow: Recipe List → Recipe Detail → Ingredients
 *
 * Concepts shown:
 *   - Registering multiple menus
 *   - goTo() with options to pass data forward
 *   - goBack() to return to previous menus
 *   - setTrackedInHistory() for back-button support
 *   - setReturnable() to show the ← Back button
 *   - setFallbackMenu() for menus that can be opened directly or navigated to
 */

import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonStyle,
} from 'discord.js';
import { FlowCord, MenuBuilder, goTo, goBack, closeMenu } from '@flowcord/core';

// --- Fake data ---
interface Recipe {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cookTime: string;
  ingredients: string[];
}

const recipes: Recipe[] = [
  {
    id: 'pasta',
    name: 'Spaghetti Bolognese',
    emoji: '🍝',
    description: 'A classic Italian pasta dish with rich meat sauce.',
    cookTime: '45 minutes',
    ingredients: ['Spaghetti', 'Ground beef', 'Tomato sauce', 'Onion', 'Garlic', 'Olive oil'],
  },
  {
    id: 'sushi',
    name: 'California Roll',
    emoji: '🍣',
    description: 'Inside-out sushi roll with crab, avocado, and cucumber.',
    cookTime: '30 minutes',
    ingredients: ['Sushi rice', 'Nori', 'Crab stick', 'Avocado', 'Cucumber', 'Rice vinegar'],
  },
  {
    id: 'tacos',
    name: 'Street Tacos',
    emoji: '🌮',
    description: 'Authentic Mexican street tacos with fresh toppings.',
    cookTime: '20 minutes',
    ingredients: ['Corn tortillas', 'Carne asada', 'Cilantro', 'Onion', 'Lime', 'Salsa verde'],
  },
];

// --- Bot setup ---
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const flowcord = new FlowCord({ client });

// ---------------------------------------------------------------------------
// Menu 1: Recipe List (the "home" menu)
// ---------------------------------------------------------------------------
flowcord.registerMenu('cookbook', (session) =>
  new MenuBuilder(session, 'cookbook')
    .setEmbeds(() => [
      new EmbedBuilder()
        .setTitle('📖 Cookbook')
        .setDescription(
          'Choose a recipe to view:\n\n' +
          recipes.map((r, i) => `**${i + 1}.** ${r.emoji} ${r.name}`).join('\n')
        )
        .setColor(0xe67e22),
    ])
    .setButtons(() =>
      recipes.map((recipe, index) => ({
        label: `${index + 1}`,
        style: ButtonStyle.Primary,
        // goTo() navigates to 'recipe-detail' and passes the recipe ID
        action: goTo('recipe-detail', { recipeId: recipe.id }),
      }))
    )
    .setCancellable()
    .setTrackedInHistory() // So 'recipe-detail' can goBack() here
    .build()
);

// ---------------------------------------------------------------------------
// Menu 2: Recipe Detail
// ---------------------------------------------------------------------------
flowcord.registerMenu('recipe-detail', (session, options) => {
  const recipeId = options?.recipeId as string;
  const recipe = recipes.find((r) => r.id === recipeId)!;

  return new MenuBuilder(session, 'recipe-detail')
    .setEmbeds(() => [
      new EmbedBuilder()
        .setTitle(`${recipe.emoji} ${recipe.name}`)
        .setDescription(recipe.description)
        .addFields(
          { name: '⏱️ Cook Time', value: recipe.cookTime, inline: true },
          { name: '🥘 Ingredients', value: `${recipe.ingredients.length} items`, inline: true },
        )
        .setColor(0x2ecc71),
    ])
    .setButtons(() => [
      {
        label: '📋 View Ingredients',
        style: ButtonStyle.Primary,
        // Navigate deeper into the ingredient list
        action: goTo('ingredients', { recipeId: recipe.id }),
      },
      {
        label: '⭐ Favorite',
        style: ButtonStyle.Success,
        action: async (ctx) => {
          // Store a flag — menu re-renders automatically
          ctx.state.set('favorited', true);
        },
      },
    ])
    .setReturnable()          // Shows ← Back button
    .setTrackedInHistory()    // So 'ingredients' can goBack() here
    .setFallbackMenu('cookbook') // If opened directly (empty stack), Back → cookbook
    .build();
});

// ---------------------------------------------------------------------------
// Menu 3: Ingredients
// ---------------------------------------------------------------------------
flowcord.registerMenu('ingredients', (session, options) => {
  const recipeId = options?.recipeId as string;
  const recipe = recipes.find((r) => r.id === recipeId)!;

  return new MenuBuilder(session, 'ingredients')
    .setEmbeds(() => [
      new EmbedBuilder()
        .setTitle(`📋 Ingredients — ${recipe.name}`)
        .setDescription(
          recipe.ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n')
        )
        .setColor(0x9b59b6)
        .setFooter({ text: 'Press Back to return to the recipe' }),
    ])
    // No buttons besides Back — just informational
    .setReturnable() // ← Back returns to recipe-detail
    .build();
});

// --- Interaction handler ---
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'cookbook') {
      await flowcord.handleInteraction(interaction, 'cookbook');
    }
  } else if (interaction.isMessageComponent()) {
    flowcord.routeComponentInteraction(interaction);
  }
});

client.once('ready', () => console.log(`Logged in as ${client.user?.tag}`));
client.login(process.env.DISCORD_BOT_TOKEN);
