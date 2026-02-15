import { EmbedBuilder } from 'discord.js';

import { AdminMenu } from '@bot/classes';
import { Region } from '@shared/models';

export const getRegionMenuEmbeds = async (
  menu: AdminMenu,
  regionId: string
) => {
  const region = await Region.findById(regionId);
  if (!region) {
    throw new Error('Region not found');
  }

  const pokedexOptionText =
    region.pokedex.length === 0
      ? '***Create Pokédex***'
      : `Modify Pokédex (${region.pokedex.length})`;
  const movesOptionText = 'Modify TM/HM/TR Lists';
  const progressionsOptionText =
    region.progressionDefinitions.size === 0
      ? '***Create Progression Type***'
      : `Modify Progression Types`;
  const locationsOptionText =
    region.locations.length === 0
      ? '***Create Starting Location***'
      : `Modify Locations`;
  const transportationOptionText =
    region.transportationTypes.length === 0
      ? '***Setup Transportation Types***'
      : `Modify Transportation Types`;
  const questsOptionText =
    region.quests.active.length === 0 && region.quests.passive.length === 0
      ? '***Create Quests***'
      : `Modify Quests`;
  const shopsOptionText =
    region.shops.length === 0 ? '***Create Shop***' : `Modify Shops`;
  const mechanicsOptionText = '***Update Mechanics***';
  const graphicsOptionText = 'Modify Graphics Settings';

  return [
    new EmbedBuilder()
      .setColor('Gold')
      .setAuthor({
        name: `${region.name} Manager Options`,
        iconURL: menu.interaction.guild?.iconURL() || undefined,
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
          ? 'Please visit the bolded/italicized options above to fix deployment issues\n'
          : '',
      })
      .setTimestamp(),
  ];
};
