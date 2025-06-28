import { EmbedBuilder, type EmbedField } from 'discord.js';

import type { AdminMenu } from '@bot/classes';
import { findRegion } from '@shared';

export const getManagePokedexMenuEmbeds = async (
  menu: AdminMenu,
  regionId: string,
  defaultPrompt = 'Enter a space-separated Pokédex number (up to 1500) and Pokémon name to add a Pokémon to a blank Pokédex slot, or enter just a number to modify a Pokédex slot'
) => {
  const region = await findRegion({ _id: regionId });
  const pokedexLines: string[] = [];

  for (
    let i = menu.paginationState.startIndex;
    i <= menu.paginationState.endIndex;
    i++
  ) {
    const pokemon = region.pokedex[i];
    pokedexLines.push(`\n${i + 1}. ${pokemon?.name ?? '-'}`);
  }
  if (pokedexLines.length === 0) {
    pokedexLines.push('\nNo Pokédex entries found.');
  }

  const fields: EmbedField[] = [];

  if (menu.paginationState.quantity <= 10) {
    fields.push({
      name: '\u200b',
      value: pokedexLines.slice().join(''),
      inline: true,
    });
  } else {
    const half = Math.ceil(menu.paginationState.quantity / 2);
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
      name: `${region.name} Pokédex Manager:`,
      iconURL: menu.interaction.guild?.iconURL() || undefined,
    })
    .setDescription(menu.prompt || defaultPrompt)
    .addFields(fields)
    .setFooter({
      text: `Showing Pokédex entr${
        menu.paginationState.startIndex === menu.paginationState.endIndex
          ? 'y'
          : 'ies'
      } ${menu.paginationState.range} of ${menu.paginationState.total}`,
    })
    .setTimestamp();

  if (menu.thumbnail) {
    embed.setThumbnail(menu.thumbnail);
  }

  return [embed];
};
