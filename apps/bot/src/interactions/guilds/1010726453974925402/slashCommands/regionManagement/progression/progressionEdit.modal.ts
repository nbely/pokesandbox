import type { AdminMenuContext } from '@bot/classes';
import type { ModalConfig } from '@flowcord/core';
import {
  CacheType,
  LabelBuilder,
  ModalBuilder,
  ModalSubmitFields,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { Progression } from './types';
import {
  getModalSelectValue,
  getModalTextValue,
  setValueOnInputBuilderIfExists,
} from '@bot/utils';
import { saveRegion } from '@bot/cache';

export const PROGRESSION_EDIT_MODAL_ID = 'progression-edit-modal';

export const getProgressionEditModal = async (
  ctx: AdminMenuContext,
  regionId: string,
  progressionKey: string
): Promise<ModalConfig<AdminMenuContext>> => {
  const region = await ctx.admin.getRegion(regionId);
  const progression = region.progressionDefinitions.get(progressionKey);
  return buildProgressionEditModal(progression, regionId, progressionKey);
};

const buildProgressionEditModal = (
  progression: Progression | undefined,
  regionId: string,
  progressionKey: string
): ModalConfig<AdminMenuContext> => {
  const builder = new ModalBuilder()
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('name')
        .setTextInputComponent(
          setValueOnInputBuilderIfExists(
            new TextInputBuilder()
              .setCustomId('progression-name')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('e.g. Badges')
              .setRequired(true),
            progression?.name
          )
        ),
      new LabelBuilder()
        .setLabel('description')
        .setTextInputComponent(
          setValueOnInputBuilderIfExists(
            new TextInputBuilder()
              .setCustomId('progression-description')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder(
                'e.g. The badges the player must collect in order to complete the region progression.'
              )
              .setRequired(false),
            progression?.description
          )
        ),
      new LabelBuilder().setLabel('visibility').setStringSelectMenuComponent(
        new StringSelectMenuBuilder()
          .setCustomId('progression-visibility')
          .setPlaceholder('Select visibility')
          .addOptions([
            {
              label: 'Public',
              value: 'public',
              default: progression?.visibility === 'public',
            },
            {
              label: 'Discoverable',
              value: 'discoverable',
              default: progression?.visibility === 'discoverable',
            },
            {
              label: 'Hidden',
              value: 'hidden',
              default: progression?.visibility === 'hidden',
            },
          ])
          .setRequired(false)
      )
    )
    .setCustomId(PROGRESSION_EDIT_MODAL_ID)
    .setTitle(`Edit Progression`);
  if (progression?.kind === 'milestone') {
    builder.addLabelComponents(
      new LabelBuilder().setLabel('sequential').setStringSelectMenuComponent(
        new StringSelectMenuBuilder()
          .setCustomId('progression-sequential')
          .setPlaceholder('Is the progression sequential?')
          .addOptions([
            {
              label: 'Yes',
              value: 'yes',
              default: progression.sequential === true,
            },
            {
              label: 'No',
              value: 'no',
              default: progression.sequential === false,
            },
          ])
          .setRequired(false)
      )
    );
  } else if (progression?.kind === 'numeric') {
    builder.addLabelComponents(
      new LabelBuilder()
        .setLabel('min')
        .setTextInputComponent(
          setValueOnInputBuilderIfExists(
            new TextInputBuilder()
              .setCustomId('progression-min')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('Minimum value for the numeric progression')
              .setRequired(false),
            progression.min?.toString()
          )
        ),
      new LabelBuilder()
        .setLabel('max')
        .setTextInputComponent(
          setValueOnInputBuilderIfExists(
            new TextInputBuilder()
              .setCustomId('progression-max')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('Maximum value for the numeric progression')
              .setRequired(false),
            progression.max?.toString()
          )
        )
    );
  }
  return {
    id: PROGRESSION_EDIT_MODAL_ID,
    builder,
    onSubmit: async (ctx, fields) => {
      const region = await ctx.admin.getRegion(regionId);
      region.progressionDefinitions.set(
        progressionKey,
        getupdatedProgression(progression, fields)
      );
      await saveRegion(region);
      await ctx.hardRefresh();
    },
  };
};

const getupdatedProgression = (
  progression: Progression | undefined,
  fields: ModalSubmitFields<CacheType>
): Progression => {
  let updatedProgression;
  if (progression?.kind === 'milestone') {
    updatedProgression = {
      name: getModalTextValue(fields.fields, 'progression-name', true),
      description: getModalTextValue(fields.fields, 'progression-description'),
      kind: progression.kind,
      visibility: getModalSelectValue(fields.fields, 'progression-visibility'),
      sequential:
        getModalSelectValue(fields.fields, 'progression-sequential') === 'yes',
      milestones: progression.milestones,
    } as Progression;
  } else if (progression?.kind === 'numeric') {
    updatedProgression = {
      name: getModalTextValue(fields.fields, 'progression-name', true),
      description: getModalTextValue(fields.fields, 'progression-description'),
      kind: progression.kind,
      visibility: getModalSelectValue(fields.fields, 'progression-visibility'),
      min: getModalTextValue(fields.fields, 'progression-min'),
      max: getModalTextValue(fields.fields, 'progression-max'),
    } as Progression;
  } else {
    updatedProgression = {
      name: getModalTextValue(fields.fields, 'progression-name', true),
      description: getModalTextValue(fields.fields, 'progression-description'),
      kind: progression?.kind,
      visibility: getModalSelectValue(fields.fields, 'progression-visibility'),
    } as Progression;
  }
  return updatedProgression;
};
