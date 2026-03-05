import { EmbedBuilder } from 'discord.js';

import type { AdminMenu } from '@bot/classes';

import type { LocationsCommandOptions } from './types';

export const getLocationsMenuEmbeds = async (
  menu: AdminMenu<LocationsCommandOptions>,
  regionId: string,
  defaultPrompt = 'Manage locations for this region. Use the buttons below to add or view a location.'
): Promise<EmbedBuilder[]> => {
  const region = await menu.getRegion(regionId);
  const locations = await menu.getLocations(regionId);
  const prompt = menu.prompt || defaultPrompt;

  const locationList =
    locations.length > 0
      ? locations.map((loc, i) => `${i + 1}. ${loc.name}`).join('\n')
      : 'No locations found.';

  return [
    new EmbedBuilder()
      .setColor('Gold')
      .setAuthor({
        name: `${region.name} Location Manager`,
        iconURL: menu.interaction.guild?.iconURL() || undefined,
      })
      .setDescription(`**${prompt}**\n\n${locationList}`)
      .setTimestamp(),
  ];
};
