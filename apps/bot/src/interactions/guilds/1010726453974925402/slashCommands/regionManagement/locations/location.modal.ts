import { randomUUID } from 'node:crypto';
import {
  LabelBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { Types } from 'mongoose';

import { saveLocation, saveRegion } from '@bot/cache';
import { AdminMenu, MenuCommandOptions, ModalConfig } from '@bot/classes';
import {
  findDuplicate,
  getModalTextValue,
  setValueOnInputBuilderIfExists,
} from '@bot/utils';
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
              .setPlaceholder(
                isEdit
                  ? 'Unchanged if left empty'
                  : 'Auto-assigned if left empty'
              )
              .setRequired(false),
            location?.ordinal?.toString()
          )
        )
    );

  return {
    builder,
    onSubmit: async (menu, { fields }) => {
      // Cast to base AdminMenu since only the shared API surface is needed
      const existingLocations = await menu.getLocations(regionId);

      const name = getModalTextValue(fields, 'location-name', true);
      const ordinalText = getModalTextValue(fields, 'location-ordinal');

      // Parse ordinal if provided; in edit mode a blank field keeps the current value
      let ordinal: number | undefined;
      if (ordinalText) {
        const parsedOrdinal = parseInt(ordinalText, 10);
        if (isNaN(parsedOrdinal) || parsedOrdinal < 1) {
          menu.warningMessage = `⚠️ Display order must be a positive number.`;
          return await menu.refresh();
        }
        ordinal = parsedOrdinal;
      }

      // Single-pass duplicate check for name and ordinal, excluding self when editing
      const duplicateError = findDuplicate(
        existingLocations,
        [
          {
            value: name.toLowerCase(),
            getValue: (loc) => loc.name.toLowerCase(),
            message: `⚠️ A location named "${name}" already exists in this region. Please choose a unique name.`,
          },
          {
            value: ordinal,
            getValue: (loc) => loc.ordinal,
            message: (loc) =>
              `⚠️ Display order ${ordinal} is already in use by "${
                loc.name
              }". ${
                isEdit
                  ? 'Please choose a different value.'
                  : 'Leave empty to auto-assign.'
              }`,
            skip: ordinal === undefined,
          },
        ],
        locationId
      );

      if (duplicateError) {
        menu.warningMessage = duplicateError;
        return await menu.refresh();
      }

      if (isEdit && locationId) {
        // Edit: update the existing location, keeping the current ordinal if field was cleared
        const existing = await menu.getLocation(locationId);
        existing.name = name;
        existing.ordinal = ordinal ?? existing.ordinal;
        await saveLocation(existing);
      } else {
        // Create: persist a new location and link it to the region
        const region = await menu.getRegion(regionId);
        const newLocation = await Location.createLocation({
          name,
          regionId: new Types.ObjectId(regionId),
          connections: [],
          trainerIds: [],
          ordinal,
        });
        region.locations.push(newLocation._id);
        await saveRegion(region);
      }

      await menu.refresh();
    },
  };
};
