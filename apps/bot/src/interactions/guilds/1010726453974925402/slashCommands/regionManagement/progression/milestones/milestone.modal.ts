import { randomUUID } from 'node:crypto';
import {
  LabelBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

import { saveRegion } from '@bot/cache';
import type { AdminMenuContext } from '@bot/classes';
import {
  assertNumericInput,
  getModalSelectValues,
  getModalTextValue,
  setValueOnInputBuilderIfExists,
} from '@bot/utils';
import type { ProgressionMilestone } from '@shared/models';
import type { ModalConfig } from '@flowcord/v2';

import { assertProgressionKind } from '../utils';
import type { MilestonesMenuState } from './types';

const MILESTONE_ADD_MODAL_ID = 'milestone-add-modal';
const MILESTONE_EDIT_MODAL_PREFIX = 'milestone-edit-';

export const getMilestoneModals = async (
  ctx: AdminMenuContext<MilestonesMenuState>,
  regionId: string,
  progressionKey: string
): Promise<ModalConfig<AdminMenuContext<MilestonesMenuState>>[]> => {
  const region = await ctx.admin.getRegion(regionId);
  const progression = region.progressionDefinitions.get(progressionKey);
  assertProgressionKind('milestone', progression);

  const modals: ModalConfig<AdminMenuContext<MilestonesMenuState>>[] = [
    buildMilestoneModal(ctx, regionId, progressionKey, MILESTONE_ADD_MODAL_ID),
    ...progression.milestones.map((milestone) =>
      buildMilestoneModal(
        ctx,
        regionId,
        progressionKey,
        `${MILESTONE_EDIT_MODAL_PREFIX}${milestone.key}`,
        milestone
      )
    ),
  ];

  return modals;
};

export const getMilestoneEditModalId = (milestoneKey: string): string =>
  `${MILESTONE_EDIT_MODAL_PREFIX}${milestoneKey}`;

export { MILESTONE_ADD_MODAL_ID };

const buildMilestoneModal = (
  _ctx: AdminMenuContext<MilestonesMenuState>,
  regionId: string,
  progressionKey: string,
  modalId: string,
  milestone?: ProgressionMilestone
): ModalConfig<AdminMenuContext<MilestonesMenuState>> => {
  const isNewMilestone = !milestone;

  const builder = new ModalBuilder()
    .setCustomId(modalId)
    .setTitle(isNewMilestone ? 'Create Milestone' : 'Edit Milestone')
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Name')
        .setTextInputComponent(
          setValueOnInputBuilderIfExists(
            new TextInputBuilder()
              .setCustomId('milestone-name')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('Ex: Boulder Badge (Must be unique)')
              .setRequired(true),
            milestone?.label
          )
        )
    )
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Description')
        .setTextInputComponent(
          setValueOnInputBuilderIfExists(
            new TextInputBuilder()
              .setCustomId('milestone-description')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder(
                'Ex: Defeat the Pewter City Gym Leader to earn the Boulder Badge.'
              )
              .setRequired(false),
            milestone?.description
          )
        )
    )
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Position in progression (optional)')
        .setTextInputComponent(
          setValueOnInputBuilderIfExists(
            new TextInputBuilder()
              .setCustomId('milestone-ordinal')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('Ex: 1 (Must be a unique integer)')
              .setRequired(false),
            milestone?.ordinal?.toString()
          )
        )
    );

  if (!isNewMilestone) {
    builder.addLabelComponents(
      new LabelBuilder()
        .setLabel('Delete Milestone?')
        .setStringSelectMenuComponent(
          new StringSelectMenuBuilder()
            .setCustomId('milestone-delete')
            .addOptions(
              {
                label: 'Yes',
                value: 'yes',
              },
              {
                label: 'No',
                value: 'no',
              }
            )
            .setRequired(false)
        )
    );
  }

  return {
    id: modalId,
    builder,
    onSubmit: async (ctx, fields) => {
      const region = await ctx.admin.getRegion(regionId);
      const progression = region.progressionDefinitions.get(progressionKey);
      assertProgressionKind('milestone', progression);

      const name = getModalTextValue(fields.fields, 'milestone-name', true);
      const description = getModalTextValue(
        fields.fields,
        'milestone-description'
      );
      const ordinal = assertNumericInput(
        getModalTextValue(fields.fields, 'milestone-ordinal'),
        'Milestone Position'
      );
      const deleteOption = getModalSelectValues(
        fields.fields,
        'milestone-delete'
      );

      if (deleteOption?.includes('yes')) {
        progression.milestones = progression.milestones.filter(
          (m) => m.key !== milestone?.key
        );
      } else if (isNewMilestone) {
        const warning = validateMilestone(
          progression.milestones,
          name,
          ordinal
        );
        if (warning) {
          ctx.state.set('warningMessage', warning);
          return;
        }

        progression.milestones.push({
          key: `milestone-${randomUUID()}`,
          label: name,
          description: description,
          ordinal: ordinal,
        });
      } else {
        const existing = progression.milestones.find(
          (m) => m.key === milestone?.key
        );
        if (!existing) {
          throw new Error(`There was an error updating the milestone.`);
        }
        const warning = validateMilestone(
          progression.milestones,
          name,
          ordinal,
          existing.key
        );
        if (warning) {
          ctx.state.set('warningMessage', warning);
          return;
        }

        existing.label = name;
        existing.description = description;
        existing.ordinal = ordinal;
      }

      region.progressionDefinitions.set(progressionKey, progression);
      await saveRegion(region);
    },
  };
};

const validateMilestone = (
  existingMilestones: ProgressionMilestone[],
  name: string,
  ordinal?: number,
  key?: string
) => {
  const isUniqueNameAndOrdinal = !existingMilestones.some(
    (m) =>
      m.key !== key &&
      (m.label === name || (ordinal !== undefined && m.ordinal === ordinal))
  );

  if (!isUniqueNameAndOrdinal) {
    return `⚠️ Oops, I failed to ${
      key ? 'update' : 'create'
    } this milestone! \nPlease make sure the name and position are unique within the progression.`;
  }
};
