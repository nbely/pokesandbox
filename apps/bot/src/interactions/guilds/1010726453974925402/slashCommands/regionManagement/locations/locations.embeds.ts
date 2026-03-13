import { EmbedBuilder } from 'discord.js';

import type { AdminMenu } from '@bot/classes';
import { createNumericListFields } from '@bot/embeds/utils/createNumericListFields';
import { sortByOrdinal } from '@bot/utils';

import type { LocationsCommandOptions } from './types';

export const getLocationsMenuEmbeds = async (
  menu: AdminMenu<LocationsCommandOptions>,
  regionId: string,
  defaultPrompt = 'Manage locations for this region. Use the buttons below to add or view a location.'
): Promise<EmbedBuilder[]> => {
  const region = await menu.getRegion(regionId);
  const locations = await menu.getLocations(regionId);
  const prompt = menu.prompt || defaultPrompt;

  // Sort locations by ordinal
  const sortedLocations = sortByOrdinal(locations);

  const locationItems = sortedLocations.map((location) => ({
    name: location.name,
    index: location.ordinal,
  }));
  const locationFields = createNumericListFields(
    locationItems,
    [
      { threshold: 11, columns: 2 },
      { threshold: 21, columns: 3 },
    ],
    'No locations found.'
  );

  const embed = new EmbedBuilder()
    .setColor('Gold')
    .setAuthor({
      name: `${region.name} Location Manager`,
      iconURL: menu.interaction.guild?.iconURL() || undefined,
    })
    .setDescription(prompt)
    .setFields(locationFields);

  if (menu.warningMessage) {
    embed.setFooter({ text: menu.warningMessage });
    menu.warningMessage = undefined;
  }

  return [embed];
};
