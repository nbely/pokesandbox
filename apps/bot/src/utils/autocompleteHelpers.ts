import type { AutocompleteInteraction } from 'discord.js';

import {
  getCachedLocations,
  getCachedRegion,
  getCachedRegions,
  getCachedServer,
} from '@bot/cache';
import type { BotClient } from '@bot/classes';
import { sortByOrdinal } from './sortByOrdinal';

type AutocompleteChoice = { name: string; value: string };

/**
 * Filters choices by the focused value (case-insensitive) and limits to 25 results.
 * Discord allows a maximum of 25 autocomplete choices.
 */
export const filterAndFormatChoices = (
  choices: AutocompleteChoice[],
  focusedValue: string
): AutocompleteChoice[] =>
  choices
    .filter((choice) =>
      choice.name.toLowerCase().includes(focusedValue.toLowerCase())
    )
    .slice(0, 25);

/**
 * Retrieves autocomplete choices for region selection based on the server's regions.
 */
export const getRegionChoices = async (
  guildId: string,
  focusedValue: string
): Promise<AutocompleteChoice[]> => {
  const server = await getCachedServer(guildId);
  if (!server) return [];
  const regions = await getCachedRegions(server.regions);

  return filterAndFormatChoices(
    regions.map((region) => ({
      name: region.name,
      value: region._id.toString(),
    })),
    focusedValue
  );
};

/**
 * Retrieves autocomplete choices for progression key selection based on a region's definitions.
 */
export const getProgressionKeyChoices = async (
  regionId: string,
  focusedValue: string
): Promise<AutocompleteChoice[]> => {
  const region = await getCachedRegion(regionId);
  if (!region) return [];

  return filterAndFormatChoices(
    Array.from(region.progressionDefinitions.entries()).map(([key, def]) => ({
      name: def.name,
      value: key,
    })),
    focusedValue
  );
};

/**
 * Handles autocomplete for a single region_id field.
 */
export const handleRegionAutocomplete = async (
  _client: BotClient,
  interaction: AutocompleteInteraction
): Promise<void> => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const focusedValue = interaction.options.getFocused().toLowerCase();
  const choices = await getRegionChoices(guildId, focusedValue);
  await interaction.respond(choices);
};

/** Handles autocomplete for commands with both region_id and pokedex_no fields. Where pokedex_no can be autocompleted with the corresponding Pokémon name */
export const handleRegionAndPokedexNoOrNameAutocomplete = async (
  _client: BotClient,
  interaction: AutocompleteInteraction
): Promise<void> => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const focused = interaction.options.getFocused(true);

  if (focused.name === 'region_id') {
    const choices = await getRegionChoices(guildId, focused.value);
    await interaction.respond(choices);
  }

  if (focused.name === 'pokedex_no') {
    const regionId = interaction.options.getString('region_id');
    const choices = await getPokedexNoWithNameChoices(regionId, focused.value);

    await interaction.respond(choices);
  }
};

const getPokedexNoWithNameChoices = async (
  regionId: string | null,
  focusedValue: string
): Promise<AutocompleteChoice[]> => {
  if (!regionId) return [];
  const region = await getCachedRegion(regionId);

  const choices = Array.from(
    { length: region?.pokedex?.length || 1500 },
    (_, i) => {
      return {
        // a combination of the pokedex number and Pokémon name (if it exists; separated by a dot) to allow autocompletion whether the user types the number or the name
        name: `${i + 1}. ${region?.pokedex[i]?.name}`,
        value: `${i + 1}`,
      };
    }
  );
  return filterAndFormatChoices(choices, focusedValue);
  // .filter((choice) => choice.name.includes(focused.value))
  // .slice(0, 25);
};

/**
 * Handles autocomplete for commands with both region_id and progression_key fields.
 */
export const handleRegionAndProgressionAutocomplete = async (
  _client: BotClient,
  interaction: AutocompleteInteraction
): Promise<void> => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const focused = interaction.options.getFocused(true);

  if (focused.name === 'region_id') {
    const choices = await getRegionChoices(guildId, focused.value);
    await interaction.respond(choices);
  }

  if (focused.name === 'progression_key') {
    const regionId = interaction.options.getString('region_id');
    if (!regionId) return interaction.respond([]);

    const choices = await getProgressionKeyChoices(regionId, focused.value);
    await interaction.respond(choices);
  }
};

/**
 * Retrieves autocomplete choices for location selection based on a region's locations.
 */
export const getLocationChoices = async (
  regionId: string,
  focusedValue: string
): Promise<AutocompleteChoice[]> => {
  const region = await getCachedRegion(regionId);
  if (!region || !region.locations.length) return [];

  const locations = await getCachedLocations(region.locations);
  const sorted = sortByOrdinal(locations);

  return filterAndFormatChoices(
    sorted.map((location) => ({
      name: location.name,
      value: location._id.toString(),
    })),
    focusedValue
  );
};

/**
 * Handles autocomplete for commands with both region_id and location_id fields.
 */
export const handleRegionAndLocationAutocomplete = async (
  _client: BotClient,
  interaction: AutocompleteInteraction
): Promise<void> => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const focused = interaction.options.getFocused(true);

  if (focused.name === 'region_id') {
    const choices = await getRegionChoices(guildId, focused.value);
    await interaction.respond(choices);
  }

  if (focused.name === 'location_id') {
    const regionId = interaction.options.getString('region_id');
    if (!regionId) return interaction.respond([]);

    const choices = await getLocationChoices(regionId, focused.value);
    await interaction.respond(choices);
  }
};
