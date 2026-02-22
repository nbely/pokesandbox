import { randomUUID } from 'node:crypto';
import {
  LabelBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

import { AdminMenu, ModalConfig, ModalState } from '@bot/classes';
import {
  assertNumericInput,
  getModalSelectValues,
  getModalTextValue,
  setValueOnInputBuilderIfExists,
} from '@bot/utils';
import { ProgressionDefinition, ProgressionMilestone, Region } from '@shared';

import { assertProgressionKind } from '../utils';
import { MilestonesCommandOptions } from './types';

export const getMilestoneUpsertModal = async (
  _menu: AdminMenu<MilestonesCommandOptions>,
  region: Region,
  progressionKey: string,
  progression: ProgressionDefinition,
  options?: ModalState['options']
): Promise<ModalConfig<AdminMenu<MilestonesCommandOptions>>> => {
  assertProgressionKind(progression, 'milestone');
  const milestone = progression.milestones.find(
    (m) => m.key === options?.milestoneKey
  );
  const isNewMilestone = !milestone;

  const builder = new ModalBuilder()
    .setCustomId(`milestone-upsert-modal-${randomUUID()}`)
    .setTitle(
      isNewMilestone
        ? `Create "${progression.name}" Milestone`
        : `Edit "${progression.name}" Milestone`
    )
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
    builder,
    onSubmit: async (menu, { fields }) => {
      const name = getModalTextValue(fields, 'milestone-name', true);
      const description = getModalTextValue(fields, 'milestone-description');
      const ordinal = assertNumericInput(
        getModalTextValue(fields, 'milestone-ordinal'),
        'Milestone Position'
      );
      const deleteOption = getModalSelectValues(fields, 'milestone-delete');

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
          menu.warningMessage = warning;
          return await menu.refresh();
        }

        progression.milestones.push({
          key: `milestone-${randomUUID()}`,
          label: name,
          description: description,
          ordinal: ordinal,
        });
      } else {
        const milestone = progression.milestones.find(
          (m) => m.key === options?.milestoneKey
        );
        if (!milestone) {
          throw new Error(`There was an error updating the milestone.`);
        }
        const warning = validateMilestone(
          progression.milestones,
          name,
          ordinal,
          milestone.key
        );
        if (warning) {
          menu.warningMessage = warning;
          return await menu.refresh();
        }

        milestone.label = name;
        milestone.description = description;
        milestone.ordinal = ordinal;
      }

      region.progressionDefinitions.set(progressionKey, progression);
      await region.save();
      await menu.refresh();
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
