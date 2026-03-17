import { EmbedBuilder } from 'discord.js';

import { getCachedLocations } from '@bot/cache';
import type { AdminMenuContext } from '@bot/classes';
import type { Location } from '@shared/models';

import type { LocationMenuState } from './types';

const getRequirementsValue = (
  requirements: Location['requirements']
): string => {
  const parts: string[] = [];
  if (
    requirements?.progressions &&
    Object.keys(requirements.progressions).length > 0
  ) {
    parts.push(
      `Progressions: ${Object.keys(requirements.progressions).length}`
    );
  }
  if (requirements?.items && requirements.items.length > 0) {
    parts.push(`Items: ${requirements.items.length}`);
  }
  if (requirements?.capabilities && requirements.capabilities.length > 0) {
    parts.push(`Capabilities: ${requirements.capabilities.length}`);
  }
  return parts.length > 0 ? parts.join('\n') : 'None';
};

const getWildTablesValue = (wildTables: Location['wildTables']): string => {
  if (!wildTables || wildTables.length === 0) return 'None';
  return wildTables.map((wt) => `• ${wt.encounterType}`).join('\n');
};

export const getLocationMenuEmbeds = async (
  ctx: AdminMenuContext<LocationMenuState>,
  regionId: string,
  locationId: string
): Promise<EmbedBuilder[]> => {
  const region = await ctx.admin.getRegion(regionId);
  const location = await ctx.admin.getLocation(locationId);
  const prompt =
    ctx.state.get('prompt') || 'Manage this location using the buttons below.';

  // Fetch only the connected location documents to avoid over-fetching
  const connectedLocationIds = location.connections.map((c) => c.toLocationId);
  const connectedLocations = await getCachedLocations(connectedLocationIds);

  const connectedNames = location.connections.map((conn) => {
    const found = connectedLocations.find(
      (loc) => loc._id.toString() === conn.toLocationId.toString()
    );
    return found ? found.name : '(Unknown Location)';
  });

  const connectionsValue =
    connectedNames.length > 0
      ? connectedNames.map((name) => `• ${name}`).join('\n')
      : 'None';

  const trainerCount = location.trainerIds?.length ?? 0;

  const embed = new EmbedBuilder()
    .setColor('Gold')
    .setAuthor({
      name: `${region.name} — Location Manager`,
      iconURL: ctx.interaction.guild?.iconURL() || undefined,
    })
    .setTitle(location.name)
    .setDescription(prompt)
    .addFields(
      { name: 'Display Order', value: String(location.ordinal), inline: true },
      { name: 'Trainers', value: String(trainerCount), inline: true },
      { name: '\u200b', value: '\u200b', inline: true },
      { name: 'Connections', value: connectionsValue, inline: true },
      {
        name: 'Entry Rules',
        value: getRequirementsValue(location.requirements),
        inline: true,
      },
      {
        name: 'Wild Tables',
        value: getWildTablesValue(location.wildTables),
        inline: true,
      }
    );

  const warningMessage = ctx.state.get('warningMessage');
  if (warningMessage) {
    embed.setFooter({ text: warningMessage });
  }

  return [embed];
};
