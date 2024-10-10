import { EmbedBuilder } from 'discord.js';

import type { AdminMenuBuilder } from '@bot/classes';

const getManageRegionMenuEmbed = (menu: AdminMenuBuilder) => {
  const pokedexOptionText =
    menu.region.pokedex.length === 0
      ? '***Create Pokédex***'
      : `Modify Pokédex (${menu.region.pokedex.length})`;
  const movesOptionText = 'Modify TM/HM/TR Lists';
  const progressionsOptionText =
    Object.keys(menu.region.progressionTypes).length === 0
      ? '***Create Progression Type***'
      : `Modify Progression Types`;
  const locationsOptionText =
    menu.region.locations.length === 0
      ? '***Create Starting Location***'
      : `Modify Locations`;
  const transportationOptionText =
    menu.region.transportationTypes.length === 0
      ? '***Setup Transportation Types***'
      : `Modify Transportation Types`;
  const questsOptionText =
    menu.region.quests.active.length === 0 &&
    menu.region.quests.passive.length === 0
      ? '***Create Quests***'
      : `Modify Quests`;
  const shopsOptionText =
    menu.region.shops.length === 0 ? '***Create Shop***' : `Modify Shops`;
  const mechanicsOptionText = '***Update Mechanics***';
  const graphicsOptionText = 'Modify Graphics Settings';

  return new EmbedBuilder()
    .setColor('Gold')
    .setAuthor({
      name: `${menu.region.name} Manager Options:`,
      iconURL: menu.commandInteraction.guild?.iconURL() || undefined,
    })
    .setDescription(
      `__Status: ${menu.region.deployed ? 'Deployed' : 'Not Deployed'}__`
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
      text: !menu.region.deployable
        ? 'Please visit the bolded/italicized options above to fix deployment issues\n'
        : '',
    })
    .setTimestamp();
};

export default getManageRegionMenuEmbed;
