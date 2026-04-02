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
import {
  getModalSelectValue,
  getModalTextValue,
  setValueOnInputBuilderIfExists,
} from '@bot/utils';
import { saveRegion } from '@bot/cache';
import { progressionDefinitionSchema } from 'shared/src/models/region/progressionDefinition';
import z from 'zod';

export const PROGRESSION_EDIT_MODAL_ID = 'progression-edit-modal';

type Progression = z.infer<typeof progressionDefinitionSchema>;

export const getProgressionEditModal = async (
  ctx: AdminMenuContext,
  regionId: string,
  progressionKey: string
): Promise<ModalConfig<AdminMenuContext>> => {
  const region = await ctx.admin.getRegion(regionId);
  const progression = region.progressionDefinitions.get(progressionKey);

  const builder = new ModalBuilder()
    .setCustomId(PROGRESSION_EDIT_MODAL_ID)
    .setTitle(`Edit Progression`);
  addCommonProgressionModalFields(builder, progression);
  if (progression?.kind === 'milestone') {
    addSequentialModalField(builder, progression);
  } else if (progression?.kind === 'numeric') {
    addMinMaxModalFields(builder, progression);
  }

  return {
    id: PROGRESSION_EDIT_MODAL_ID,
    builder,
    onSubmit: async (ctx, fields) => {
      const region = await ctx.admin.getRegion(regionId);
      region.progressionDefinitions.set(
        progressionKey,
        getUpdatedProgression(progression, fields)
      );
      await saveRegion(region);
      await ctx.hardRefresh();
    },
  };
};

// Adds the name, description, and visibility fields to the progression edit modal
const addCommonProgressionModalFields = (
  builder: ModalBuilder,
  progression: Progression | undefined
): void => {
  builder.addLabelComponents(
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
  );
};

const addSequentialModalField = (
  builder: ModalBuilder,
  progression: Progression | undefined
): void => {
  builder.addLabelComponents(
    new LabelBuilder().setLabel('sequential').setStringSelectMenuComponent(
      new StringSelectMenuBuilder()
        .setCustomId('progression-sequential')
        .setPlaceholder('Is the progression sequential?')
        .addOptions([
          {
            label: 'Yes',
            value: 'yes',
            default:
              progression?.kind === 'milestone' &&
              progression.sequential === true,
          },
          {
            label: 'No',
            value: 'no',
            default:
              progression?.kind === 'milestone' &&
              progression.sequential === false,
          },
        ])
        .setRequired(false)
    )
  );
};

const addMinMaxModalFields = (
  builder: ModalBuilder,
  progression: Progression | undefined
): void => {
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
          progression?.kind === 'numeric'
            ? progression.min?.toString()
            : undefined
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
          progression?.kind === 'numeric'
            ? progression.max?.toString()
            : undefined
        )
      )
  );
};

const getUpdatedProgression = (
  progression: Progression | undefined,
  fields: ModalSubmitFields<CacheType>
): Progression => {
  let updatedProgression = {
    name: getModalTextValue(fields.fields, 'progression-name', true),
    description: getModalTextValue(fields.fields, 'progression-description'),
    kind: progression?.kind,
    visibility: getModalSelectValue(fields.fields, 'progression-visibility'),
  } as Progression;
  if (progression?.kind === 'milestone') {
    updatedProgression = {
      ...updatedProgression,
      sequential:
        getModalSelectValue(fields.fields, 'progression-sequential') === 'yes',
      milestones: progression.milestones,
    } as Progression;
  } else if (progression?.kind === 'numeric') {
    updatedProgression = {
      ...updatedProgression,
      min: getModalTextValue(fields.fields, 'progression-min'),
      max: getModalTextValue(fields.fields, 'progression-max'),
    } as Progression;
  }
  return updatedProgression;
};
