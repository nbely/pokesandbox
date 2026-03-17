/**
 * Example 03 — State Management & Lifecycle Hooks
 *
 * Demonstrates per-menu state, session-wide state, and lifecycle hooks.
 *
 * Slash command: /workout
 * A workout tracker that lets you log exercises across multiple menus.
 *
 * Concepts shown:
 *   - Typed menu state with MenuBuilder<TState>
 *   - ctx.state (per-menu) vs ctx.sessionState (session-wide)
 *   - setup() for one-time initialization
 *   - onEnter / onLeave hooks for logging
 *   - beforeRender for fetching fresh data before each render
 *   - afterRender for side effects after display
 *   - onAction hook for tracking user interactions
 */

import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonStyle,
} from 'discord.js';
import { FlowCord, MenuBuilder, goTo, closeMenu } from '@flowcord/core';

// --- Types ---
interface Exercise {
  name: string;
  reps: number;
  addedAt: number;
}

type DashboardState = {
  greeting: string;
  viewCount: number;
};

type ExerciseMenuState = {
  selectedExercise: string | null;
};

// --- Fake "database" ---
const exerciseLibrary = [
  { name: '🏋️ Squats', reps: 15 },
  { name: '🤸 Push-ups', reps: 20 },
  { name: '🏃 Lunges', reps: 12 },
  { name: '💪 Bicep Curls', reps: 10 },
  { name: '🧘 Planks', reps: 3 },
];

// --- Bot setup ---
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const flowcord = new FlowCord({ client });

// ---------------------------------------------------------------------------
// Menu 1: Workout Dashboard
// ---------------------------------------------------------------------------
flowcord.registerMenu('workout', (session) =>
  new MenuBuilder<DashboardState>(session, 'workout')
    // setup() runs once when the menu is created
    .setup((ctx) => {
      const hour = new Date().getHours();
      const greeting =
        hour < 12
          ? '🌅 Good morning'
          : hour < 18
          ? '☀️ Good afternoon'
          : '🌙 Good evening';
      ctx.state.set('greeting', greeting);
      ctx.state.set('viewCount', 0);

      // Session state persists across all menus in this session
      if (!ctx.sessionState.has('workoutLog')) {
        ctx.sessionState.set('workoutLog', [] as Exercise[]);
      }
    })

    // onEnter fires every time the menu is entered (including coming back)
    .onEnter((ctx) => {
      const count = ctx.state.get('viewCount');
      ctx.state.set('viewCount', count + 1);
      console.log(`[onEnter] Dashboard entered (view #${count + 1})`);
    })

    // beforeRender fires before every render cycle
    .beforeRender((ctx) => {
      console.log(`[beforeRender] About to render dashboard`);
    })

    // afterRender fires after the Discord message is sent/updated
    .afterRender((ctx) => {
      const log = ctx.sessionState.get<Exercise[]>('workoutLog') ?? [];
      console.log(
        `[afterRender] Dashboard rendered. Total exercises logged: ${log.length}`
      );
    })

    // onAction fires after any button action
    .onAction((ctx) => {
      console.log(`[onAction] User performed an action on dashboard`);
    })

    .onCancel((ctx) => {
      console.log(`[onCancel] Dashboard cancelled`);
    })

    // onLeave fires when navigating away
    .onLeave((ctx) => {
      console.log(`[onLeave] Leaving dashboard`);
    })

    .setEmbeds((ctx) => {
      const log = ctx.sessionState.get<Exercise[]>('workoutLog') ?? [];
      const totalReps = log.reduce((sum, ex) => sum + ex.reps, 0);

      return [
        new EmbedBuilder()
          .setTitle(`${ctx.state.get('greeting')}! 💪 Workout Dashboard`)
          .setDescription(
            log.length === 0
              ? 'No exercises logged yet. Start your workout!'
              : `**Exercises logged:** ${log.length}\n` +
                  `**Total reps:** ${totalReps}\n\n` +
                  log.map((ex) => `• ${ex.name} — ${ex.reps} reps`).join('\n')
          )
          .setColor(log.length >= 3 ? 0x2ecc71 : 0xe74c3c)
          .setFooter({
            text: `Views this session: ${ctx.state.get('viewCount')}`,
          })
          .setTimestamp(),
      ];
    })

    .setButtons(() => [
      {
        label: '➕ Add Exercise',
        style: ButtonStyle.Success,
        action: goTo('exercise-picker'),
      },
      {
        label: '🗑️ Clear Log',
        style: ButtonStyle.Danger,
        action: async (ctx) => {
          ctx.sessionState.set('workoutLog', []);
          // Re-renders automatically — embed shows "no exercises"
        },
      },
      {
        label: '✅ Finish Workout',
        style: ButtonStyle.Secondary,
        action: closeMenu(),
      },
    ])

    .setCancellable()
    .setTrackedInHistory()
    .build()
);

// ---------------------------------------------------------------------------
// Menu 2: Exercise Picker
// ---------------------------------------------------------------------------
flowcord.registerMenu('exercise-picker', (session) =>
  new MenuBuilder<ExerciseMenuState>(session, 'exercise-picker')
    .setup((ctx) => {
      ctx.state.set('selectedExercise', null);
    })

    .onEnter((ctx) => {
      console.log(`[onEnter] Exercise picker opened`);
    })

    .setEmbeds(() => [
      new EmbedBuilder()
        .setTitle('🏋️ Choose an Exercise')
        .setDescription(
          exerciseLibrary
            .map((ex, i) => `**${i + 1}.** ${ex.name} (${ex.reps} reps)`)
            .join('\n')
        )
        .setColor(0x3498db),
    ])

    .setButtons(() =>
      exerciseLibrary.map((exercise, index) => ({
        label: `${index + 1}`,
        style: ButtonStyle.Primary,
        action: async (ctx) => {
          // Add exercise to the session-wide workout log
          const log = ctx.sessionState.get<Exercise[]>('workoutLog') ?? [];
          log.push({
            name: exercise.name,
            reps: exercise.reps,
            addedAt: Date.now(),
          });
          ctx.sessionState.set('workoutLog', log);

          // Go back to dashboard — it will re-render with the updated log
          await ctx.goBack();
        },
      }))
    )

    .setReturnable()
    .build()
);

// --- Interaction handler ---
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'workout') {
      await flowcord.handleInteraction(interaction, 'workout');
    }
  } else if (interaction.isMessageComponent()) {
    flowcord.routeComponentInteraction(interaction);
  }
});

client.once('ready', () => console.log(`Logged in as ${client.user?.tag}`));
client.login(process.env.DISCORD_BOT_TOKEN);
