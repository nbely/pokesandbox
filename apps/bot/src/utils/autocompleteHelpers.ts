import type { AutocompleteInteraction } from 'discord.js';

import { getCachedRegion, getCachedRegions, getCachedServer } from '@bot/cache';
import type { BotClient } from '@bot/classes';

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
