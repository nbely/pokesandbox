import { randomUUID } from 'node:crypto';
import {
  LabelBuilder,
  ModalBuilder,
  ModalSubmitFields,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { Types } from 'mongoose';

import { saveLocation, saveRegion } from '@bot/cache';
import { AdminMenu, ModalConfig } from '@bot/classes';
import { getModalTextValue, setValueOnInputBuilderIfExists } from '@bot/utils';
import { Location } from '@shared/models';

import type { LocationCommandOptions, LocationsCommandOptions } from './types';

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
      await handleCreateLocation(menu, regionId, fields);
    },
  };
};

export const getLocationEditModal = async (
  menu: AdminMenu<LocationCommandOptions>,
  regionId: string,
  locationId: string
): Promise<ModalConfig<AdminMenu<LocationCommandOptions>>> => {
  const location = await menu.getLocation(locationId);

  const builder = new ModalBuilder()
    .setCustomId(`location-edit-modal-${randomUUID()}`)
    .setTitle('Edit Location')
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Location Name')
        .setTextInputComponent(
          setValueOnInputBuilderIfExists(
            new TextInputBuilder()
              .setCustomId('location-name')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('Pallet Town')
              .setRequired(true),
            location.name
          )
        ),
      new LabelBuilder()
        .setLabel('Display Order (Leave blank to keep current)')
        .setTextInputComponent(
          setValueOnInputBuilderIfExists(
            new TextInputBuilder()
              .setCustomId('location-ordinal')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('Unchanged if left empty')
              .setRequired(false),
            location.ordinal?.toString()
          )
        )
    );

  return {
    builder,
    onSubmit: async (menu, { fields }) => {
      await handleEditLocation(menu, regionId, locationId, fields);
    },
  };
};

async function handleCreateLocation(
  menu: AdminMenu<LocationsCommandOptions>,
  regionId: string,
  fields: ModalSubmitFields['fields']
): Promise<void> {
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
}

async function handleEditLocation(
  menu: AdminMenu<LocationCommandOptions>,
  regionId: string,
  locationId: string,
  fields: ModalSubmitFields['fields']
): Promise<void> {
  const location = await menu.getLocation(locationId);
  const existingLocations = await menu.getLocations(regionId);

  const name = getModalTextValue(fields, 'location-name', true);
  const ordinalText = getModalTextValue(fields, 'location-ordinal');

  // Validate name uniqueness, excluding the current location
  const isDuplicate = existingLocations.some(
    (loc) =>
      loc._id.toString() !== locationId &&
      loc.name.toLowerCase() === name.toLowerCase()
  );

  if (isDuplicate) {
    menu.warningMessage = `⚠️ A location named "${name}" already exists in this region. Please choose a unique name.`;
    return await menu.refresh();
  }

  // Parse and validate ordinal if provided; keep existing if field is cleared
  let ordinal: number = location.ordinal;
  if (ordinalText) {
    const parsedOrdinal = parseInt(ordinalText, 10);
    if (isNaN(parsedOrdinal) || parsedOrdinal < 1) {
      menu.warningMessage = `⚠️ Display order must be a positive number.`;
      return await menu.refresh();
    }

    // Check for duplicate ordinal excluding the current location
    const existingLocation = existingLocations.find(
      (loc) =>
        loc._id.toString() !== locationId && loc.ordinal === parsedOrdinal
    );
    if (existingLocation) {
      menu.warningMessage = `⚠️ Display order ${parsedOrdinal} is already in use by "${existingLocation.name}". Please choose a different value.`;
      return await menu.refresh();
    }

    ordinal = parsedOrdinal;
  }

  location.name = name;
  location.ordinal = ordinal;
  await saveLocation(location);
  await menu.refresh();
}
