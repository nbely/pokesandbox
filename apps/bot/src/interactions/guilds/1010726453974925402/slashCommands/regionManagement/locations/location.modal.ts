import { randomUUID } from 'node:crypto';
import {
  LabelBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { Types } from 'mongoose';

import { saveRegion } from '@bot/cache';
import { AdminMenu, ModalConfig } from '@bot/classes';
import { getModalTextValue } from '@bot/utils';
import { Location } from '@shared/models';

import type { LocationsCommandOptions } from './types';

export const getLocationCreateModal = async (
  menu: AdminMenu<LocationsCommandOptions>,
  regionId: string
): Promise<ModalConfig<AdminMenu<LocationsCommandOptions>>> => {
  const builder = new ModalBuilder()
    .setCustomId(`location-create-modal-${randomUUID()}`)
    .setTitle('Create New Location')
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Location Name')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('location-name')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Pallet Town')
            .setRequired(true)
        ),
      new LabelBuilder()
        .setLabel('Display Order (Optional)')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('location-ordinal')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Auto-assigned if left empty')
            .setRequired(false)
        )
    );

  return {
    builder,
    onSubmit: async (menu, { fields }) => {
      const region = await menu.getRegion(regionId);
      const existingLocations = await menu.getLocations(regionId);

      const name = getModalTextValue(fields, 'location-name', true);
      const ordinalText = getModalTextValue(fields, 'location-ordinal');

      const isDuplicate = existingLocations.some(
        (location) => location.name.toLowerCase() === name.toLowerCase()
      );

      if (isDuplicate) {
        menu.warningMessage = `⚠️ A location named "${name}" already exists in this region. Please choose a unique name.`;
        return await menu.refresh();
      }

      // Parse and validate ordinal if provided
      let ordinal: number | undefined;
      if (ordinalText) {
        const parsedOrdinal = parseInt(ordinalText, 10);
        if (isNaN(parsedOrdinal) || parsedOrdinal < 1) {
          menu.warningMessage = `⚠️ Display order must be a positive number.`;
          return await menu.refresh();
        }

        // Check for duplicate ordinal
        const existingLocation = existingLocations.find(
          (location) => location.ordinal === parsedOrdinal
        );
        if (existingLocation) {
          menu.warningMessage = `⚠️ Display order ${parsedOrdinal} is already in use by "${existingLocation.name}". Leave empty to auto-assign.`;
          return await menu.refresh();
        }

        ordinal = parsedOrdinal;
      }

      const newLocation = await Location.createLocation({
        name,
        regionId: new Types.ObjectId(regionId),
        connections: [],
        trainerIds: [],
        ordinal,
      });

      region.locations.push(newLocation._id);
      await saveRegion(region);
      await menu.refresh();
    },
  };
};
