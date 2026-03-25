import {
  ButtonStyle,
  InteractionContextType,
  LabelBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ModalSubmitFields,
} from 'discord.js';

import { saveServer } from '@bot/cache';
import { AdminMenuBuilder, type AdminMenuContext } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';
import { Region } from '@shared/models';
import type { ButtonInputConfig } from '@flowcord/core';

import { REGION_COMMAND_NAME } from '../region/region';
import { getRegionsMenuEmbeds } from './regions.embeds';
import { RegionsMenuState } from './types';

const COMMAND_NAME = 'regions';
export const REGIONS_COMMAND_NAME = COMMAND_NAME;
const REGION_CREATE_MODAL_ID = 'region-create-modal';
const REGION_NAME_FIELD_ID = 'region-name';

export const RegionsCommand: ISlashCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Manage Regions for your PokéSandbox server')
    .setContexts(InteractionContextType.Guild),
  createMenu: (session) =>
    new AdminMenuBuilder<RegionsMenuState>(session, COMMAND_NAME)
      .setButtons(getRegionsButtons)
      .setModal(() => ({
        id: REGION_CREATE_MODAL_ID,
        builder: getRegionCreateModal(),
        onSubmit: async (ctx, fields): Promise<void> => {
          const regionName = getRegionNameFromModal(fields);
          const existingRegions = await ctx.admin.getRegions();
          const hasDuplicateRegionName = existingRegions.some(
            (region) =>
              region.name.trim().toLowerCase() === regionName.toLowerCase()
          );

          if (hasDuplicateRegionName) {
            ctx.state.set(
              'prompt',
              `A region named "${regionName}" already exists. Please choose a different name.`
            );
            return;
          }

          const server = await ctx.admin.getServer();
          const region = await Region.create({
            baseGeneration: 10,
            charactersPerPlayer: 1,
            characterList: [],
            currencyType: 'P',
            deployable: false,
            deployed: false,
            graphicSettings: {
              backSpritesEnabled: false,
              frontSpritesEnabled: false,
              iconSpritesEnabled: false,
            },
            locations: [],
            name: regionName,
            pokedex: [],
            progressionDefinitions: new Map(),
            quests: {
              active: [],
              passive: [],
            },
            shops: [],
            transportationTypes: [],
          });

          server.regions.push(region._id);
          await saveServer(server);

          ctx.state.set(
            'prompt',
            `Successfully created the new region: \`${region.name}\``
          );
        },
      }))
      .setEmbeds(getRegionsMenuEmbeds)
      .setCancellable()
      .setTrackedInHistory()
      .build(),
};

const getRegionCreateModal = (): ModalBuilder => {
  return new ModalBuilder()
    .setCustomId(REGION_CREATE_MODAL_ID)
    .setTitle('Create New Region')
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Region Name')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId(REGION_NAME_FIELD_ID)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g. Kanto, Johto, etc.')
            .setRequired(true)
            .setMaxLength(80)
        )
    );
};

const getRegionNameFromModal = (fields: ModalSubmitFields): string => {
  return fields.getTextInputValue(REGION_NAME_FIELD_ID).trim();
};

const getRegionsButtons = async (
  ctx: AdminMenuContext<RegionsMenuState>
): Promise<ButtonInputConfig<AdminMenuContext<RegionsMenuState>>[]> => {
  const regions = await ctx.admin.getRegions();

  return [
    {
      label: 'Create Region',
      fixedPosition: 'start',
      style: ButtonStyle.Success,
      opensModal: REGION_CREATE_MODAL_ID,
    },
    ...regions.map((region) => ({
      label: region.name,
      id: region._id.toString(),
      style: ButtonStyle.Primary,
      action: async (ctx: AdminMenuContext<RegionsMenuState>) =>
        ctx.goTo(REGION_COMMAND_NAME, {
          region_id: region._id.toString(),
        }),
    })),
  ];
};
