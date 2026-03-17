/**
 * Example 05 — Select Menus & Modals
 *
 * Demonstrates select menus for choosing options and modals for form input.
 *
 * Slash command: /event
 * A party event planner that lets you:
 *   1. Pick a theme via a select menu
 *   2. Fill in event details via a modal form
 *   3. View the finalized event
 *
 * Concepts shown:
 *   - setSelectMenu() with StringSelectMenuBuilder
 *   - setModal() with TextInputBuilder for form input
 *   - opensModal on a button to trigger the modal
 *   - Multiple modals on one menu (add vs edit)
 *   - onSubmit callback for processing modal input
 *   - Auto re-render after modal submission
 */

import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  LabelBuilder,
} from 'discord.js';
import { FlowCord, MenuBuilder, goTo, closeMenu } from '@flowcord/core';

// --- Types ---
type ThemePickerState = {
  selectedTheme: string | null;
};

type EventSessionState = {
  eventTheme: string;
};

type EventDetailsState = {
  name: string | null;
  description: string | null;
  maxGuests: string | null;
  theme: string | null;
};

// --- Fake data ---
const themes = [
  { label: '🎃 Halloween Bash', value: 'halloween', color: 0xff6600 },
  { label: '🎄 Winter Wonderland', value: 'winter', color: 0x00bfff },
  { label: '🌴 Tropical Luau', value: 'tropical', color: 0x00cc66 },
  { label: '🚀 Space Odyssey', value: 'space', color: 0x6600cc },
  { label: '🎭 Masquerade Ball', value: 'masquerade', color: 0xcc0066 },
];

// --- Bot setup ---
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const flowcord = new FlowCord({ client });

// ---------------------------------------------------------------------------
// Menu 1: Theme Picker (Select Menu)
// ---------------------------------------------------------------------------
flowcord.registerMenu('event', (session) =>
  new MenuBuilder<ThemePickerState, EventSessionState>(session, 'event')
    .setup((ctx) => {
      ctx.state.set('selectedTheme', null);
    })

    .setEmbeds((ctx) => {
      const selected = ctx.state.get('selectedTheme');
      const theme = themes.find((t) => t.value === selected);

      return [
        new EmbedBuilder()
          .setTitle('🎉 Event Planner')
          .setDescription(
            selected
              ? `You selected: **${theme?.label}**\n\nPress "Plan Event" to fill in the details.`
              : 'Choose a theme for your event from the dropdown below.'
          )
          .setColor(theme?.color ?? 0x95a5a6),
      ];
    })

    // --- SELECT MENU ---
    .setSelectMenu(() => ({
      builder: new StringSelectMenuBuilder()
        .setPlaceholder('🎨 Choose a theme...')
        .addOptions(
          themes.map((t) => ({
            label: t.label,
            value: t.value,
          }))
        ),
      onSelect: async (ctx, values) => {
        ctx.state.set('selectedTheme', values[0]);
        // Store in session state so the next menu can access it
        ctx.sessionState.set('eventTheme', values[0]);
        // Menu re-renders automatically showing the selection
      },
    }))

    // --- BUTTONS ---
    .setButtons((ctx) => [
      {
        label: 'Plan Event',
        style: ButtonStyle.Primary,
        disabled: !ctx.state.get('selectedTheme'),
        action: goTo('event-details'),
      },
    ])
    .setCancellable()
    .setTrackedInHistory()
    .build()
);

// ---------------------------------------------------------------------------
// Menu 2: Event Details (Modal Form)
// ---------------------------------------------------------------------------
flowcord.registerMenu('event-details', (session) =>
  new MenuBuilder<EventDetailsState, EventSessionState>(
    session,
    'event-details'
  )
    .setup((ctx) => {
      ctx.state.set('name', null);
      ctx.state.set('description', null);
      ctx.state.set('maxGuests', null);

      const selectedTheme = ctx.sessionState.get('eventTheme');
      ctx.state.set('theme', selectedTheme ?? null);
    })

    .setEmbeds((ctx) => {
      const name = ctx.state.get('name');
      const description = ctx.state.get('description');
      const maxGuests = ctx.state.get('maxGuests');
      const themeValue = ctx.state.get('theme');
      const theme = themes.find((t) => t.value === themeValue);

      // Before modal is filled
      if (!name) {
        return [
          new EmbedBuilder()
            .setTitle('📝 Event Details')
            .setDescription(
              `Theme: **${theme?.label ?? 'None'}**\n\n` +
                'Click "Fill Details" to enter your event information.'
            )
            .setColor(theme?.color ?? 0x95a5a6),
        ];
      }

      // After modal is filled — show the event summary
      return [
        new EmbedBuilder()
          .setTitle(`🎉 ${name}`)
          .setDescription(description ?? 'No description provided.')
          .addFields(
            { name: '🎨 Theme', value: theme?.label ?? 'None', inline: true },
            {
              name: '👥 Max Guests',
              value: maxGuests ?? 'Unlimited',
              inline: true,
            }
          )
          .setColor(theme?.color ?? 0x2ecc71)
          .setFooter({
            text: 'Click "Edit Details" to modify, or "Confirm" to finalize.',
          }),
      ];
    })

    // --- MODAL (with two different modals: create and edit) ---
    .setModal((ctx) => {
      const existingName = ctx.state.get('name');

      // Return an array of modals — each with a unique ID
      return [
        {
          id: 'create-event',
          builder: new ModalBuilder()
            .setCustomId('create-event')
            .setTitle('Create Event')
            .addLabelComponents(
              new LabelBuilder()
                .setLabel('Name')
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setCustomId('event-name')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('e.g. Annual Company Party')
                    .setRequired(true)
                    .setMaxLength(100)
                ),
              new LabelBuilder()
                .setLabel('Description')
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setCustomId('event-description')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Tell guests what to expect...')
                    .setRequired(false)
                    .setMaxLength(500)
                ),
              new LabelBuilder()
                .setLabel('Maximum Guests')
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setCustomId('event-max-guests')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('e.g. 50 (leave blank for unlimited)')
                    .setRequired(false)
                )
            ),
          onSubmit: async (ctx, fields) => {
            ctx.state.set('name', fields.getTextInputValue('event-name'));
            ctx.state.set(
              'description',
              fields.getTextInputValue('event-description') || null
            );
            ctx.state.set(
              'maxGuests',
              fields.getTextInputValue('event-max-guests') || null
            );
            // Menu re-renders automatically after modal submit
          },
        },
        {
          id: 'edit-event',
          builder: new ModalBuilder()
            .setCustomId('edit-event')
            .setTitle('Edit Event')
            .addLabelComponents(
              new LabelBuilder().setLabel('Name').setTextInputComponent(
                new TextInputBuilder()
                  .setCustomId('event-name')
                  .setStyle(TextInputStyle.Short)
                  .setValue(existingName ?? '')
                  .setRequired(true)
              ),
              new LabelBuilder().setLabel('Description').setTextInputComponent(
                new TextInputBuilder()
                  .setCustomId('event-description')
                  .setStyle(TextInputStyle.Paragraph)
                  .setValue(ctx.state.get('description') ?? '')
                  .setRequired(false)
              ),
              new LabelBuilder()
                .setLabel('Maximum Guests')
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setCustomId('event-max-guests')

                    .setStyle(TextInputStyle.Short)
                    .setValue(ctx.state.get('maxGuests') ?? '')
                    .setRequired(false)
                )
            ),
          onSubmit: async (ctx, fields) => {
            ctx.state.set('name', fields.getTextInputValue('event-name'));
            ctx.state.set(
              'description',
              fields.getTextInputValue('event-description') || null
            );
            ctx.state.set(
              'maxGuests',
              fields.getTextInputValue('event-max-guests') || null
            );
          },
        },
      ];
    })

    .setButtons((ctx) => {
      const hasName = ctx.state.get('name') !== null;

      if (!hasName) {
        // Before filling details — show the "create" modal button
        return [
          {
            label: '📝 Fill Details',
            style: ButtonStyle.Primary,
            opensModal: 'create-event', // Opens the "create" modal
          },
        ];
      }

      // After filling — show edit + confirm buttons
      return [
        {
          label: '✏️ Edit Details',
          style: ButtonStyle.Secondary,
          opensModal: 'edit-event', // Opens the "edit" modal (pre-filled)
        },
        {
          label: '✅ Confirm Event',
          style: ButtonStyle.Success,
          action: closeMenu(),
        },
      ];
    })

    .setReturnable()
    .build()
);

// --- Interaction handler ---
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'event') {
      await flowcord.handleInteraction(interaction, 'event');
    }
  } else if (interaction.isMessageComponent()) {
    flowcord.routeComponentInteraction(interaction);
  }
});

client.once('ready', () => console.log(`Logged in as ${client.user?.tag}`));
client.login(process.env.DISCORD_BOT_TOKEN);
