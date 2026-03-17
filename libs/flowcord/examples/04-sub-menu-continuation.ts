/**
 * Example 04 — Sub-Menu with Continuation
 *
 * Demonstrates the parent–child menu pattern where a child menu returns
 * a result to the parent via ctx.complete().
 *
 * Slash command: /party
 * Flow: Party Builder → Recruit Member (sub-menu) → back to Party Builder
 *
 * Concepts shown:
 *   - ctx.openSubMenu() to open a child with an onComplete callback
 *   - ctx.complete(result) to finish a child and return data to the parent
 *   - Continuation callback receiving the result
 *   - Multiple sub-menu invocations building up parent state over time
 */

import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonStyle,
} from 'discord.js';
import {
  type ButtonInputConfig,
  FlowCord,
  MenuBuilder,
  closeMenu,
  goBack,
} from '@flowcord/core';

// --- Types ---
interface Adventurer {
  name: string;
  role: string;
  emoji: string;
  power: number;
}

type PartyState = {
  members: Adventurer[];
  maxSize: number;
};

// --- Fake data ---
const availableRecruits: Adventurer[] = [
  { name: 'Aria', role: 'Healer', emoji: '💚', power: 45 },
  { name: 'Bjorn', role: 'Tank', emoji: '🛡️', power: 70 },
  { name: 'Cleo', role: 'Mage', emoji: '🔮', power: 85 },
  { name: 'Drake', role: 'Ranger', emoji: '🏹', power: 60 },
  { name: 'Ember', role: 'Assassin', emoji: '🗡️', power: 90 },
  { name: 'Freya', role: 'Bard', emoji: '🎵', power: 35 },
];

// --- Bot setup ---
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const flowcord = new FlowCord({ client });

// ---------------------------------------------------------------------------
// Parent Menu: Party Builder
// ---------------------------------------------------------------------------
flowcord.registerMenu('party', (session) =>
  new MenuBuilder<PartyState>(session, 'party')
    .setup((ctx) => {
      ctx.state.set('members', []);
      ctx.state.set('maxSize', 4);
    })

    .setEmbeds((ctx) => {
      const members = ctx.state.get('members');
      const maxSize = ctx.state.get('maxSize');
      const totalPower = members.reduce((sum, m) => sum + m.power, 0);

      return [
        new EmbedBuilder()
          .setTitle('⚔️ Adventure Party Builder')
          .setDescription(
            members.length === 0
              ? 'Your party is empty! Recruit some adventurers.'
              : `**Party (${members.length}/${maxSize}):**\n\n` +
                  members
                    .map(
                      (m, i) =>
                        `${i + 1}. ${m.emoji} **${m.name}** — ${m.role} (⚡ ${
                          m.power
                        })`
                    )
                    .join('\n') +
                  `\n\n**Total Power:** ⚡ ${totalPower}`
          )
          .setColor(members.length >= maxSize ? 0x2ecc71 : 0xe67e22)
          .setFooter({
            text:
              members.length >= maxSize
                ? 'Party is full! Ready for adventure!'
                : `${maxSize - members.length} slot(s) remaining`,
          }),
      ];
    })

    .setButtons((ctx) => {
      const members = ctx.state.get('members');
      const maxSize = ctx.state.get('maxSize');
      const isFull = members.length >= maxSize;

      return [
        {
          label: '🆕 Recruit Member',
          style: ButtonStyle.Success,
          disabled: isFull,
          action: async (ctx) => {
            const currentMembers = ctx.state.get('members');

            // Open a sub-menu — the onComplete callback fires when the
            // child menu calls ctx.complete(result)
            await ctx.openSubMenu('recruit', {
              // Pass the current member names so the child can filter them out
              alreadyRecruited: currentMembers.map((m) => m.name),

              // This callback runs on the PARENT context when the child completes
              onComplete: async (parentCtx, result) => {
                if (result) {
                  const recruited = result as Adventurer;
                  const updatedMembers = parentCtx.state.get(
                    'members'
                  ) as Adventurer[];
                  updatedMembers.push(recruited);
                  parentCtx.state.set('members', [...updatedMembers]);
                }
              },
            });
          },
        },
        {
          label: '🗑️ Remove Last',
          style: ButtonStyle.Danger,
          disabled: members.length === 0,
          action: async (ctx) => {
            const updatedMembers = ctx.state.get('members');
            updatedMembers.pop();
            ctx.state.set('members', [...updatedMembers]);
          },
        },
        {
          label: '🚀 Start Adventure',
          style: ButtonStyle.Primary,
          disabled: members.length === 0,
          action: closeMenu(),
        },
      ];
    })

    .setCancellable()
    .setTrackedInHistory()
    .setPreserveStateOnReturn() // Ensure state is preserved when returning from the sub-menu
    .build()
);

// ---------------------------------------------------------------------------
// Child Menu: Recruit an Adventurer
// ---------------------------------------------------------------------------
flowcord.registerMenu('recruit', (session, options) => {
  const alreadyRecruited = (options?.alreadyRecruited as string[]) ?? [];
  const available = availableRecruits.filter(
    (r) => !alreadyRecruited.includes(r.name)
  );

  return new MenuBuilder(session, 'recruit')
    .setEmbeds(() => [
      new EmbedBuilder()
        .setTitle('🏰 Adventurer Guild')
        .setDescription(
          available.length === 0
            ? 'No more adventurers available!'
            : 'Choose an adventurer to recruit:\n\n' +
                available
                  .map(
                    (r, i) =>
                      `**${i + 1}.** ${r.emoji} **${r.name}** — ${r.role} (⚡ ${
                        r.power
                      })`
                  )
                  .join('\n')
        )
        .setColor(0x9b59b6),
    ])

    .setButtons(() => [
      ...available.map((recruit, index) => ({
        label: `${index + 1}`,
        style: ButtonStyle.Primary as ButtonStyle,
        action: async (ctx): ButtonInputConfig => {
          // Complete the sub-menu and return the selected recruit to the parent
          await ctx.complete(recruit);
        },
      })),
      {
        label: 'Never mind',
        style: ButtonStyle.Secondary,
        action: goBack(), // Return without a result
      },
    ])

    .build();
});

// --- Interaction handler ---
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'party') {
      await flowcord.handleInteraction(interaction, 'party');
    }
  } else if (interaction.isMessageComponent()) {
    flowcord.routeComponentInteraction(interaction);
  }
});

client.once('ready', () => console.log(`Logged in as ${client.user?.tag}`));
client.login(process.env.DISCORD_BOT_TOKEN);
