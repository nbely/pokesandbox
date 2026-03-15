import { EmbedBuilder } from 'discord.js';

import type { AdminMenuContext } from '@bot/classes';

import type { RegionMenuState } from './types';

export const getRegionMenuEmbeds = async (
  ctx: AdminMenuContext<RegionMenuState>,
  regionId: string
) => {
  const region = await ctx.admin.getRegion(regionId);

  const pokedexOptionText =
    region.pokedex.length === 0
      ? '***Create Pokédex***'
      : `Modify Pokédex (${region.pokedex.length})`;
  const movesOptionText = 'Modify TM/HM/TR Lists';
  const progressionsOptionText =
    region.progressionDefinitions.size === 0
      ? '***Create Progressions***'
      : `Modify Progressions`;
  const locationsOptionText =
    region.locations.length === 0
      ? '***Create Locations***'
      : `Modify Locations`;
  const transportationOptionText =
    region.transportationTypes.length === 0
      ? '***Create Transportation Types***'
      : `Modify Transportation Types`;
  const questsOptionText =
    region.quests.active.length === 0 && region.quests.passive.length === 0
      ? '***Create Quests***'
      : `Modify Quests`;
  const shopsOptionText =
    region.shops.length === 0 ? '***Create Shops***' : `Modify Shops`;
  const mechanicsOptionText = '***Update Mechanics***';
  const graphicsOptionText = 'Modify Graphics Settings';

  return [
    new EmbedBuilder()
      .setColor('Gold')
      .setAuthor({
        name: `${region.name} Manager Options`,
        iconURL: ctx.interaction.guild?.iconURL() || undefined,
      })
      .setDescription(
        `__Status: ${region.deployed ? 'Deployed' : 'Not Deployed'}__`
      )
      .addFields(
        {
          name: '\u200b',
          value:
            `\n:one: ${pokedexOptionText}` +
            `\n:two: ${movesOptionText}` +
            `\n:three: ${progressionsOptionText}` +
            `\n:four: ${locationsOptionText}` +
            `\n:five: ${transportationOptionText}`,
          inline: true,
        },
        {
          name: '\u200b',
          value:
            `\n:six: ${questsOptionText}` +
            `\n:seven: ${shopsOptionText}` +
            `\n:eight: ${mechanicsOptionText}` +
            `\n:nine: ${graphicsOptionText}`,
          inline: true,
        }
      )
      .setFooter({
        text: !region.deployable
          ? 'Please create configurations for the bolded & italicized sub-menus to meet deployment requirements.\n'
          : '',
      }),
  ];
};
