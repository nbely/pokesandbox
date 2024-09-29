import { EmbedBuilder, type EmbedField } from 'discord.js';

import type { AdminMenu } from '@bot/classes';

const getManageRegionMenuEmbed = (menu: AdminMenu): EmbedBuilder => {
  const pokedexLines: string[] = [];
  for (
    let i = menu.paginationOptions._currentStartIndex;
    i < menu.paginationOptions._currentEndIndex;
    i++
  ) {
    const pokemon = menu.region.pokedex[i];
    pokedexLines.push(`\n${i + 1}. ${pokemon?.name ?? '-'}`);
  }
  if (pokedexLines.length === 0) {
    pokedexLines.push('\nNo Pokédex entries found.');
  }

  const fields: EmbedField[] = [];

  if (menu.paginationOptions._currentQuantity <= 10) {
    fields.push({
      name: '\u200b',
      value: pokedexLines.slice().join(''),
      inline: true,
    });
  } else {
    const half = Math.ceil(menu.paginationOptions._currentQuantity / 2);
    fields.push({
      name: '\u200b',
      value: pokedexLines.slice(0, half).join(''),
      inline: true,
    });
    fields.push({
      name: '\u200b',
      value: pokedexLines.slice(half).join(''),
      inline: true,
    });
  }

  const embed = new EmbedBuilder()
    .setColor('Gold')
    .setAuthor({
      name: `${menu.region.name} Pokédex Manager:`,
      iconURL: menu.commandInteraction.guild?.iconURL() || undefined,
    })
    .setDescription(menu.description)
    .addFields(fields)
    .setFooter({
      text: `Showing Pokédex entries ${menu.paginationOptions._currentRange} of ${menu.paginationOptions.totalQuantity}`,
    })
    .setTimestamp();

  if (menu.thumbnail) {
    embed.setThumbnail(menu.thumbnail);
  }

  return embed;
};

export default getManageRegionMenuEmbed;
