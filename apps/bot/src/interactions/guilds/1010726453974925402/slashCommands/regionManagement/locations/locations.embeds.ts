import { EmbedBuilder } from 'discord.js';

import type { AdminMenuContext } from '@bot/classes';
import { createNumericListFields } from '@bot/embeds/utils/createNumericListFields';
import { paginateListForButtonPagination } from '@bot/embeds/utils/paginateListForButtonPagination';
import { sortByOrdinal } from '@bot/utils';

import type { LocationsMenuState } from './types';

export const getLocationsMenuEmbeds = async (
  ctx: AdminMenuContext<LocationsMenuState>,
  regionId: string,
  defaultPrompt = 'Manage locations for this region. Use the buttons below to add or view a location.'
): Promise<EmbedBuilder[]> => {
  const region = await ctx.admin.getRegion(regionId);
  const locations = await ctx.admin.getLocations(regionId);
  const prompt = ctx.state.get('prompt') || defaultPrompt;

  // Sort locations by ordinal
  const sortedLocations = sortByOrdinal(locations);
  const {
    totalItems,
    footerText,
    visibleItems: visibleLocations,
  } = paginateListForButtonPagination(sortedLocations, ctx.pagination, {
    itemLabel: 'location',
  });

  const locationItems = visibleLocations.map((location) => ({
    name: location.name,
    index: location.ordinal,
  }));
  const locationFields = createNumericListFields(
    locationItems,
    [{ threshold: 1, columns: 3 }],
    true,
    'No locations found.'
  );

  const embed = new EmbedBuilder()
    .setColor('Gold')
    .setAuthor({
      name: `${region.name} Location Manager`,
      iconURL: ctx.interaction.guild?.iconURL() || undefined,
    })
    .setDescription(prompt)
    .setFields(locationFields);

  const warningMessage = ctx.state.get('warningMessage');
  const paginationText = totalItems > 0 ? footerText : undefined;

  if (warningMessage && paginationText) {
    embed.setFooter({ text: `${warningMessage} • ${paginationText}` });
  } else if (warningMessage) {
    embed.setFooter({ text: warningMessage });
  } else if (paginationText) {
    embed.setFooter({ text: paginationText });
  }

  return [embed];
};
