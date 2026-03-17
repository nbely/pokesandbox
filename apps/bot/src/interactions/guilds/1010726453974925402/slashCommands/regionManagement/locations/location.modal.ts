import {
  LabelBuilder,
  ModalBuilder,
  type ModalSubmitFields,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { Types } from 'mongoose';

import { saveLocation, saveRegion } from '@bot/cache';
import type { AdminMenuContext } from '@bot/classes';
import {
  findDuplicate,
  getModalTextValue,
  setValueOnInputBuilderIfExists,
} from '@bot/utils';
import { Location } from '@shared/models';
import type { ModalConfig } from '@flowcord';

import type { LocationMenuState, LocationsMenuState } from './types';

const LOCATION_CREATE_MODAL_ID = 'location-create-modal';
const LOCATION_EDIT_MODAL_ID = 'location-edit-modal';
const LOCATION_NAME_FIELD_ID = 'location-name';
const LOCATION_ORDINAL_FIELD_ID = 'location-ordinal';
const INVALID_ORDINAL_WARNING = '⚠️ Display order must be a positive number.';

export { LOCATION_CREATE_MODAL_ID, LOCATION_EDIT_MODAL_ID };

type LocationModalInput = {
  name: string;
  ordinal?: number;
};

type DuplicateLocationCandidate = {
  _id: { toString(): string };
  name: string;
  ordinal?: number;
};

const setWarningMessage = <
  TState extends LocationsMenuState | LocationMenuState
>(
  ctx: AdminMenuContext<TState>,
  warningMessage: string
): void => {
  ctx.state.set(
    'warningMessage' as keyof TState & string,
    warningMessage as TState[keyof TState & string]
  );
};

const parseLocationModalInput = (
  fields: ModalSubmitFields['fields']
): LocationModalInput | undefined => {
  const name = getModalTextValue(fields, LOCATION_NAME_FIELD_ID, true);
  const ordinalText = getModalTextValue(fields, LOCATION_ORDINAL_FIELD_ID);

  let ordinal: number | undefined;
  if (ordinalText) {
    const parsedOrdinal = parseInt(ordinalText, 10);
    if (isNaN(parsedOrdinal) || parsedOrdinal < 1) {
      return undefined;
    }
    ordinal = parsedOrdinal;
  }

  return { name, ordinal };
};

const getDuplicateLocationError = (
  existingLocations: DuplicateLocationCandidate[],
  name: string,
  ordinal: number | undefined,
  mode: 'create' | 'edit',
  existingLocationId?: string
): string | undefined => {
  return findDuplicate(
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
          `⚠️ Display order ${ordinal} is already in use by "${loc.name}". ${
            mode === 'create'
              ? 'Leave empty to auto-assign.'
              : 'Please choose a different value.'
          }`,
        skip: ordinal === undefined,
      },
    ],
    existingLocationId
  );
};

const buildLocationModal = (
  modalId: string,
  title: string,
  ordinalPlaceholder: string,
  initialValues?: {
    name?: string;
    ordinal?: string;
  }
): ModalBuilder => {
  return new ModalBuilder()
    .setCustomId(modalId)
    .setTitle(title)
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Location Name')
        .setTextInputComponent(
          setValueOnInputBuilderIfExists(
            new TextInputBuilder()
              .setCustomId(LOCATION_NAME_FIELD_ID)
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('Pallet Town')
              .setRequired(true),
            initialValues?.name
          )
        ),
      new LabelBuilder()
        .setLabel('Display Order (Optional)')
        .setTextInputComponent(
          setValueOnInputBuilderIfExists(
            new TextInputBuilder()
              .setCustomId(LOCATION_ORDINAL_FIELD_ID)
              .setStyle(TextInputStyle.Short)
              .setPlaceholder(ordinalPlaceholder)
              .setRequired(false),
            initialValues?.ordinal
          )
        )
    );
};

/**
 * Returns a modal config for creating a new location (used by the locations list menu).
 */
export const getLocationCreateModal = async <
  TState extends LocationsMenuState | LocationMenuState
>(
  _ctx: AdminMenuContext<TState>,
  regionId: string
): Promise<ModalConfig<AdminMenuContext<TState>>> => {
  return {
    id: LOCATION_CREATE_MODAL_ID,
    builder: buildLocationModal(
      LOCATION_CREATE_MODAL_ID,
      'Create New Location',
      'Auto-assigned if left empty'
    ),
    onSubmit: async (ctx, fields) => {
      const existingLocations = await ctx.admin.getLocations(regionId);

      const input = parseLocationModalInput(fields.fields);
      if (!input) {
        setWarningMessage(ctx, INVALID_ORDINAL_WARNING);
        return;
      }

      const duplicateError = getDuplicateLocationError(
        existingLocations,
        input.name,
        input.ordinal,
        'create'
      );

      if (duplicateError) {
        setWarningMessage(ctx, duplicateError);
        return;
      }

      const region = await ctx.admin.getRegion(regionId);
      const newLocation = await Location.createLocation({
        name: input.name,
        regionId: new Types.ObjectId(regionId),
        connections: [],
        trainerIds: [],
        ordinal: input.ordinal,
      });
      region.locations.push(newLocation._id);
      await saveRegion(region);
    },
  };
};

/**
 * Returns a modal config for editing an existing location (used by the location detail menu).
 */
export const getLocationEditModal = async (
  ctx: AdminMenuContext<LocationMenuState>,
  regionId: string,
  locationId: string
): Promise<ModalConfig<AdminMenuContext<LocationMenuState>>> => {
  const location = await ctx.admin.getLocation(locationId);

  return {
    id: LOCATION_EDIT_MODAL_ID,
    builder: buildLocationModal(
      LOCATION_EDIT_MODAL_ID,
      'Edit Location',
      'Unchanged if left empty',
      {
        name: location.name,
        ordinal: location.ordinal?.toString(),
      }
    ),
    onSubmit: async (ctx, fields) => {
      const existingLocations = await ctx.admin.getLocations(regionId);

      const input = parseLocationModalInput(fields.fields);
      if (!input) {
        setWarningMessage(ctx, INVALID_ORDINAL_WARNING);
        return;
      }

      const duplicateError = getDuplicateLocationError(
        existingLocations,
        input.name,
        input.ordinal,
        'edit',
        locationId
      );

      if (duplicateError) {
        setWarningMessage(ctx, duplicateError);
        return;
      }

      const existing = await ctx.admin.getLocation(locationId);
      existing.name = input.name;
      existing.ordinal = input.ordinal ?? existing.ordinal;
      await saveLocation(existing);
    },
  };
};
