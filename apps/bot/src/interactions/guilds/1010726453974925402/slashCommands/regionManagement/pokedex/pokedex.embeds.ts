import { EmbedBuilder, type EmbedField } from 'discord.js';

import type { AdminMenu, MenuCommandOptions } from '@bot/classes';
import { DexEntry, Region } from '@shared/models';

export const getManagePokedexMenuEmbeds = async <
  C extends MenuCommandOptions = MenuCommandOptions
>(
  menu: AdminMenu<C>,
  regionId: string,
  defaultPrompt = 'Enter a space-separated Pokédex number (up to 1500) and Pokémon name to add a Pokémon to a blank Pokédex slot, or enter just a number to modify a Pokédex slot'
) => {
  const region = await Region.findById(regionId);
  if (!region) {
    throw new Error('Region not found');
  }
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
      value: pokedexLines.join(''),
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

export const getAddPokedexSlotEmbeds = async <
  C extends MenuCommandOptions = MenuCommandOptions
>(
  menu: AdminMenu<C>,
  regionId: string,
  pokedexNo: string,
  defaultPrompt = 'This slot is currently empty. Please enter the name of a Pokémon to add to the Pokédex slot.'
) => {
  const region = await Region.findById(regionId);
  if (!region) {
    throw new Error('Region not found');
  }

  return [
    new EmbedBuilder()
      .setColor('Gold')
      .setAuthor({
        name: `${region.name} Pokédex Slot #${pokedexNo}`,
        iconURL: menu.interaction.guild?.iconURL() || undefined,
      })
      .setDescription(menu.prompt || defaultPrompt)
      .setTimestamp(),
  ];
};

export const getEditPokedexSlotEmbeds = async <
  C extends MenuCommandOptions = MenuCommandOptions
>(
  menu: AdminMenu<C>,
  regionId: string,
  pokedexNo: string
) => {
  const region = await Region.findById(regionId);
  if (!region) {
    throw new Error('Region not found');
  }
  const dexEntry = await DexEntry.findById(region.pokedex[+pokedexNo - 1]?.id);
  if (!dexEntry) {
    throw new Error('Dex entry not found');
  }
  // TODO: Decide on the final format of the embed
  const embed = new EmbedBuilder()
    .setColor('Gold')
    .setAuthor({
      name: `#${pokedexNo}: ${dexEntry.name} - The ${dexEntry.classification} Pokémon`,
      iconURL: menu.interaction.guild?.iconURL() || undefined,
    })
    .setDescription(
      `Types: ${dexEntry.types.join(', ')}
      Abilities: ${dexEntry.abilities[0]}${
        dexEntry.abilities[1] ? `/${dexEntry.abilities[1]}` : ''
      }${dexEntry.abilities.H ? ` (H: ${dexEntry.abilities.H})` : ''}`
    )
    .setTimestamp();

  const thumbnail = dexEntry.sprites.g5?.bw?.normal.front;
  if (thumbnail) {
    embed.setThumbnail(thumbnail);
  }

  return [embed];
};

export const getSelectMatchedPokemonEmbeds = async <
  C extends MenuCommandOptions = MenuCommandOptions
>(
  menu: AdminMenu<C>,
  matchedDexEntryIds: string[],
  defaultPrompt = 'Select a Pokémon from the search results by clicking the corresponding button.'
): Promise<EmbedBuilder[]> => {
  const matchedOptions: string[] = [];
  const matchedPokemon: DexEntry[] = await DexEntry.find().byIds(
    matchedDexEntryIds
  );
  matchedPokemon.sort((a, b) => a.num - b.num);

  for (
    let i = menu.paginationState.startIndex;
    i <= menu.paginationState.endIndex;
    i++
  ) {
    matchedOptions.push(`\n${i + 1}. ${matchedPokemon[i].name}`);
  }

  const fields: EmbedField[] = [];

  if (menu.paginationState.quantity <= 5) {
    fields.push({
      name: '\u200b',
      value: matchedOptions.slice().join(''),
      inline: true,
    });
  } else {
    const half = Math.ceil(menu.paginationState.quantity / 2);
    fields.push({
      name: '\u200b',
      value: matchedOptions.slice(0, half).join(''),
      inline: true,
    });
    fields.push({
      name: '\u200b',
      value: matchedOptions.slice(half).join(''),
      inline: true,
    });
  }

  return [
    new EmbedBuilder()
      .setColor('Gold')
      .setAuthor({
        name: `Select a search result match:`,
        iconURL: menu.interaction.guild?.iconURL() || undefined,
      })
      .setDescription(menu.prompt || defaultPrompt)
      .addFields(fields)
      .setFooter({
        text: `Showing match${
          menu.paginationState.startIndex === menu.paginationState.endIndex
            ? ''
            : 'es'
        } ${menu.paginationState.range} of ${matchedDexEntryIds.length}`,
      })
      .setTimestamp(),
  ];
};
