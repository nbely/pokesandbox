import { ModalSubmitFields, TextInputBuilder } from 'discord.js';

export function getModalTextValue(
  fields: ModalSubmitFields['fields'],
  customId: string
): string | undefined;

export function getModalTextValue(
  fields: ModalSubmitFields['fields'],
  customId: string,
  required: true
): string;

export function getModalTextValue(
  fields: ModalSubmitFields['fields'],
  customId: string,
  required?: boolean
): string | undefined {
  const field = fields.get(customId);
  if (!field || !('value' in field)) return undefined;
  return field.value;
}

export function getModalSelectValue(
  fields: ModalSubmitFields['fields'],
  customId: string
): string | undefined;

export function getModalSelectValue(
  fields: ModalSubmitFields['fields'],
  customId: string,
  required: true
): string;

export function getModalSelectValue(
  fields: ModalSubmitFields['fields'],
  customId: string,
  required?: boolean
): string | undefined {
  const field = fields.get(customId);
  if (!field || !('values' in field) || field.values.length === 0)
    return undefined;
  return field.values[0];
}

export function getModalSelectValues(
  fields: ModalSubmitFields['fields'],
  customId: string
): string[] | undefined;

export function getModalSelectValues(
  fields: ModalSubmitFields['fields'],
  customId: string,
  required: true
): string[];

export function getModalSelectValues(
  fields: ModalSubmitFields['fields'],
  customId: string,
  required?: boolean
): string[] | undefined {
  const field = fields.get(customId);
  if (!field || !('values' in field)) return undefined;
  return [...field.values];
}

export const setValueOnInputBuilderIfExists = (
  builder: TextInputBuilder,
  value?: string
) => {
  if (value) {
    builder.setValue(value);
  }

  return builder;
};
