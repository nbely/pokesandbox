import { EmbedBuilder } from 'discord.js';

import type { AdminMenu } from '@bot/classes';

import type { LocationCommandOptions } from './types';

export const getLocationMenuEmbeds = async (
  menu: AdminMenu<LocationCommandOptions>,
  regionId: string,
  locationId: string
): Promise<EmbedBuilder[]> => {
  const region = await menu.getRegion(regionId);
  const location = await menu.getLocation(locationId);
  const allLocations = await menu.getLocations(regionId);
  const prompt = menu.prompt || 'Manage this location using the buttons below.';

  // Build connected location names
  const connectedNames = location.connections
    .map((conn) => {
      const found = allLocations.find(
        (loc) => loc._id.toString() === conn.toLocationId.toString()
      );
      return found ? found.name : '(Unknown Location)';
    });

  const connectionsValue =
    connectedNames.length > 0
      ? connectedNames.map((name) => `• ${name}`).join('\n')
      : 'None';

  // Build entry requirements summary
  const reqs = location.requirements;
  const reqParts: string[] = [];
  if (reqs?.progressions && Object.keys(reqs.progressions).length > 0) {
    reqParts.push(`Progressions: ${Object.keys(reqs.progressions).length}`);
  }
  if (reqs?.items && reqs.items.length > 0) {
    reqParts.push(`Items: ${reqs.items.length}`);
  }
  if (reqs?.capabilities && reqs.capabilities.length > 0) {
    reqParts.push(`Capabilities: ${reqs.capabilities.length}`);
  }
  const requirementsValue =
    reqParts.length > 0 ? reqParts.join('\n') : 'None';

  // Trainer count
  const trainerCount = location.trainerIds?.length ?? 0;

  // Wild encounter types
  const wildTableTypes =
    location.wildTables && location.wildTables.length > 0
      ? location.wildTables.map((wt) => wt.encounterType)
      : [];
  const wildTablesValue =
    wildTableTypes.length > 0
      ? wildTableTypes.map((t) => `• ${t}`).join('\n')
      : 'None';

  const embed = new EmbedBuilder()
    .setColor('Gold')
    .setAuthor({
      name: `${region.name} — Location Manager`,
      iconURL: menu.interaction.guild?.iconURL() || undefined,
    })
    .setTitle(location.name)
    .setDescription(prompt)
    .addFields(
      { name: 'Display Order', value: String(location.ordinal), inline: true },
      { name: 'Trainers', value: String(trainerCount), inline: true },
      { name: '\u200b', value: '\u200b', inline: true },
      { name: 'Connections', value: connectionsValue, inline: true },
      { name: 'Entry Requirements', value: requirementsValue, inline: true },
      { name: '\u200b', value: '\u200b', inline: true },
      { name: 'Wild Encounter Types', value: wildTablesValue, inline: false }
    );

  if (menu.warningMessage) {
    embed.setFooter({ text: menu.warningMessage });
    menu.warningMessage = undefined;
  }

  return [embed];
};
