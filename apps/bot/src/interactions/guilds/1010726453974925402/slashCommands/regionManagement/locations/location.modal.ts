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
import { AdminMenu, MenuCommandOptions, ModalConfig } from '@bot/classes';
import { getModalTextValue, setValueOnInputBuilderIfExists } from '@bot/utils';
import { Location } from '@shared/models';

/**
 * Returns a single modal config for creating or editing a location.
 * When `locationId` is provided the modal opens in edit mode with pre-populated
 * fields and edit-specific behaviour (ordinal unchanged when cleared).
 */
export const getLocationModal = async <C extends MenuCommandOptions>(
  menu: AdminMenu<C>,
  regionId: string,
  locationId?: string
): Promise<ModalConfig<AdminMenu<C>>> => {
  const isEdit = !!locationId;
  const location = isEdit ? await menu.getLocation(locationId) : undefined;

  const builder = new ModalBuilder()
    .setCustomId(`location-modal-${randomUUID()}`)
    .setTitle(isEdit ? 'Edit Location' : 'Create New Location')
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
            location?.name
          )
        ),
      new LabelBuilder()
        .setLabel('Display Order (Optional)')
        .setTextInputComponent(
          setValueOnInputBuilderIfExists(
            new TextInputBuilder()
              .setCustomId('location-ordinal')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder(isEdit ? 'Unchanged if left empty' : 'Auto-assigned if left empty')
              .setRequired(false),
            location?.ordinal?.toString()
          )
        )
    );

  return {
    builder,
    onSubmit: async (menu, { fields }) => {
      // Cast to base AdminMenu since helpers only need shared API surface
      const baseMenu = menu as unknown as AdminMenu;
      if (isEdit && locationId) {
        await handleEditLocation(baseMenu, regionId, locationId, fields);
      } else {
        await handleCreateLocation(baseMenu, regionId, fields);
      }
    },
  };
};

async function handleCreateLocation(
  menu: AdminMenu,
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
  menu: AdminMenu,
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
