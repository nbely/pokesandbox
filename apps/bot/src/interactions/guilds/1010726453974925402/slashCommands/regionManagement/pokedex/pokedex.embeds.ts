import { EmbedBuilder, type EmbedField } from 'discord.js';

import type { AdminMenuContext } from '@bot/classes';
import { getAssertedCachedDexEntry, getCachedDexEntries } from '@bot/cache';
import { Gen5 } from '@shared/models';

import type { PokedexMenuState } from './types';
import { PokedexSlotCustomizeMenuState } from './types';

export const getManagePokedexMenuEmbeds = async (
  ctx: AdminMenuContext<PokedexMenuState>,
  regionId: string,
  defaultPrompt = 'Enter a space-separated Pokédex number (up to 1500) and Pokémon name to add a Pokémon to a blank Pokédex slot, or enter just a number to modify a Pokédex slot'
) => {
  const region = await ctx.admin.getRegion(regionId);
  const pokedexLines: string[] = [];

  const startIndex = ctx.pagination?.startIndex ?? 0;
  const endIndex = ctx.pagination?.endIndex ?? region.pokedex.length;

  for (let i = startIndex; i < endIndex; i++) {
    const pokemon = region.pokedex[i];
    pokedexLines.push(`\n${i + 1}. ${pokemon?.name ?? '-'}`);
  }
  if (pokedexLines.length === 0) {
    pokedexLines.push('\nNo Pokédex entries found.');
  }

  const fields: EmbedField[] = [];
  const quantity = endIndex - startIndex;

  if (quantity <= 10) {
    fields.push({
      name: '\u200b',
      value: pokedexLines.join(''),
      inline: true,
    });
  } else {
    const half = Math.ceil(quantity / 2);
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

  const totalItems = ctx.pagination?.totalItems ?? region.pokedex.length;

  const footerText =
    totalItems === 0
      ? 'Showing Pokédex entries 0 of 0'
      : `Showing Pokédex entr${startIndex === endIndex - 1 ? 'y' : 'ies'} ${
          startIndex + 1
        }-${endIndex} of ${totalItems}`;

  const embed = new EmbedBuilder()
    .setColor('Gold')
    .setAuthor({
      name: `${region.name} Pokédex Manager:`,
      iconURL: ctx.interaction.guild?.iconURL() || undefined,
    })
    .setDescription(ctx.state.get('prompt') || defaultPrompt)
    .addFields(fields)
    .setFooter({
      text: footerText,
    })
    .setTimestamp();

  const thumbnail = ctx.state.get('thumbnail');
  if (thumbnail) {
    embed.setThumbnail(thumbnail);
  }

  return [embed];
};

export const getAddPokedexSlotEmbeds = async (
  ctx: AdminMenuContext<PokedexMenuState>,
  regionId: string,
  pokedexNo: string,
  defaultPrompt = 'This slot is currently empty. Please enter the name of a Pokémon to add to the Pokédex slot.'
) => {
  const region = await ctx.admin.getRegion(regionId);

  return [
    new EmbedBuilder()
      .setColor('Gold')
      .setAuthor({
        name: `${region.name} Pokédex Slot #${pokedexNo}`,
        iconURL: ctx.interaction.guild?.iconURL() || undefined,
      })
      .setDescription(ctx.state.get('prompt') || defaultPrompt)
      .setTimestamp(),
  ];
};

export const getEditPokedexSlotEmbeds = async (
  ctx: AdminMenuContext<PokedexMenuState>,
  regionId: string,
  pokedexNo: string
) => {
  const region = await ctx.admin.getRegion(regionId);
  const dexEntryId = region.pokedex[+pokedexNo - 1]?.id;
  const dexEntry = await getAssertedCachedDexEntry(dexEntryId);

  const embed = new EmbedBuilder()
    .setColor('Gold')
    .setAuthor({
      name: `#${pokedexNo}: ${dexEntry.name} - The ${dexEntry.classification} Pokémon`,
      iconURL: ctx.interaction.guild?.iconURL() || undefined,
    })
    .setDescription(
      `Types: ${dexEntry.types.join(', ')}
      Abilities: ${dexEntry.abilities[0]}${
        dexEntry.abilities[1] ? `/${dexEntry.abilities[1]}` : ''
      }${dexEntry.abilities.H ? ` (H: ${dexEntry.abilities.H})` : ''}`
    )
    .setTimestamp();

  const thumbnail = dexEntry.sprites.g5?.get(Gen5.bw)?.normal?.front;
  if (thumbnail) {
    embed.setThumbnail(thumbnail);
  }

  return [embed];
};

export const getSelectMatchedPokemonEmbeds = async (
  ctx: AdminMenuContext<PokedexMenuState>,
  matchedDexEntryIds: string[],
  defaultPrompt = 'Select a Pokémon from the search results by clicking the corresponding button.'
): Promise<EmbedBuilder[]> => {
  const matchedOptions: string[] = [];
  const matchedPokemon = await getCachedDexEntries(matchedDexEntryIds);
  matchedPokemon.sort((a, b) => a.num - b.num);

  const startIndex = ctx.pagination?.startIndex ?? 0;
  const endIndex = ctx.pagination?.endIndex ?? matchedPokemon.length;

  for (let i = startIndex; i < endIndex; i++) {
    matchedOptions.push(`\n${i + 1}. ${matchedPokemon[i].name}`);
  }

  const fields: EmbedField[] = [];
  const quantity = endIndex - startIndex;

  if (quantity <= 5) {
    fields.push({
      name: '\u200b',
      value: matchedOptions.slice().join(''),
      inline: true,
    });
  } else {
    const half = Math.ceil(quantity / 2);
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
        iconURL: ctx.interaction.guild?.iconURL() || undefined,
      })
      .setDescription(ctx.state.get('prompt') || defaultPrompt)
      .addFields(fields)
      .setFooter({
        text: `Showing match${startIndex === endIndex - 1 ? '' : 'es'} ${
          startIndex + 1
        }-${endIndex} of ${matchedDexEntryIds.length}`,
      })
      .setTimestamp(),
  ];
};

export const getPokedexSlotCustomizeEmbeds = async (
  ctx: AdminMenuContext<PokedexSlotCustomizeMenuState>,
  regionId: string,
  pokedexSlotNo: string,
  forms: Map<string, string>,
  defaultPrompt = 'Select available forms for this Pokédex slot by clicking the corresponding button.'
): Promise<EmbedBuilder[]> => {
  const region = await ctx.admin.getRegion(regionId);
  const slot = region.pokedex[+pokedexSlotNo - 1];
  const dexEntry = await getAssertedCachedDexEntry(slot?.id);

  const formeOptions: string[] =
    slot?.includedForms?.map(
      (forme, idx) =>
        `\n${idx + 1}. ${forms.get(forme.id.toString()) || 'Unknown Form'}`
    ) || [];
  !slot?.isBaseFormNotIncluded &&
    formeOptions.unshift(
      `0. ${forms.get(dexEntry.id.toString()) || 'Unknown Form'} (Base Form)`
    );
  const fields: EmbedField[] = [];

  fields.push({
    name: '\u200b',
    value: formeOptions.join(''),
    inline: true,
  });

  return [
    new EmbedBuilder()
      .setTitle(`Customize Pokédex Slot ${pokedexSlotNo}`)
      .setDescription(
        `Current: ${
          region.pokedex[+pokedexSlotNo - 1]?.name
        }\n\n${defaultPrompt}`
      )
      .addFields(fields)
      .setTimestamp(),
  ];
};
