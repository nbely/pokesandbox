import {
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  LabelBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

import {
  AdminMenuBuilder,
  MenuButtonConfig,
  ModalConfig,
  ModalState,
  type AdminMenu,
} from '@bot/classes';
import { ISlashCommand } from '@bot/structures/interfaces';
import {
  assertNumericInput,
  getModalSelectValues,
  getModalTextValue,
  onlyAdminRoles,
} from '@bot/utils';
import { ProgressionDefinition, Region } from '@shared';

import { assertProgressionKind } from '../utils';
import { milestonesMenuEmbeds } from './milestone.embeds';
import { randomUUID } from 'node:crypto';
import { set } from 'lodash';

const COMMAND_NAME = 'milestones';
export const MILESTONES_COMMAND_NAME = COMMAND_NAME;

type MilestonesCommandOptions = {
  regionId: string;
  progressionKey: string;
};
type MilestonesCommand = ISlashCommand<
  AdminMenu<MilestonesCommandOptions>,
  MilestonesCommandOptions
>;

export const MilestonesCommand: MilestonesCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription(
      'Create a new milestone for a region progression definition'
    )
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, options) => {
    if (!options?.regionId || !options?.progressionKey) {
      throw new Error(
        'Region ID and progression key are required to create a milestone.'
      );
    }

    const { regionId, progressionKey } = options;
    const region = await Region.findById(regionId);
    if (!region) {
      throw new Error('Region not found.');
    }

    const progression = region.progressionDefinitions.get(progressionKey);
    if (!progression) {
      throw new Error('Progression definition not found.');
    }

    return new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setEmbeds((menu) =>
        milestonesMenuEmbeds(
          menu,
          'Add a new milestone, or select and existing one to edit or delete.'
        )
      )
      .setButtons((menu) => getMilestonesButtons(menu, progression))
      .setModal((menu, options) =>
        getMilestoneUpsertModal(menu, region, progression, options)
      )
      .setTrackedInHistory()
      .setCancellable()
      .setReturnable()
      .build();
  },
};

export const getMilestonesButtons = async (
  _menu: AdminMenu<MilestonesCommandOptions>,
  progression: ProgressionDefinition
): Promise<MenuButtonConfig<AdminMenu<MilestonesCommandOptions>>[]> => {
  assertProgressionKind(progression, 'milestone');

  return [
    {
      label: 'Add Milestone',
      style: ButtonStyle.Success,
      fixedPosition: 'start',
      onClick: async (menu: AdminMenu<MilestonesCommandOptions>) => {
        await menu.openModal();
      },
    },
    ...progression.milestones.map((milestone) => ({
      label: milestone.label,
      style: ButtonStyle.Primary,
      onClick: async (menu: AdminMenu<MilestonesCommandOptions>) => {
        await menu.openModal({ milestoneKey: milestone.key });
      },
    })),
  ];
};

export const getMilestoneUpsertModal = async (
  _menu: AdminMenu<MilestonesCommandOptions>,
  region: Region,
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
              .setPlaceholder('Ex: Boulder Badge')
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
              .setPlaceholder('Ex: 1')
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
        progression.milestones.push({
          key: `milestone-${Date.now()}`,
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

        milestone.label = name;
        milestone.description = description;
        milestone.ordinal = ordinal;
      }

      await region.save();
      await menu.session.goBack();
    },
  };
};

const setValueOnInputBuilderIfExists = (
  builder: TextInputBuilder,
  value?: string
) => {
  if (value) {
    builder.setValue(value);
  }

  return builder;
};
