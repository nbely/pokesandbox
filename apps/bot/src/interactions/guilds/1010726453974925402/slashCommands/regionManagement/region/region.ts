import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { AdminMenu, AdminMenuBuilder, MenuButtonConfig } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles, openMenu } from '@bot/utils';
import { findRegion, upsertRegion } from '@shared';

import { getRegionMenuEmbeds } from './region.embeds';
import { MANAGE_POKEDEX_COMMAND_NAME } from '../pokedex/managePokedex';

const COMMAND_NAME = 'region';
export const REGION_COMMAND_NAME = COMMAND_NAME;

export const RegionCommand: ISlashCommand<AdminMenu> = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Manage a Region for your PokéSandbox server')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, regionId) =>
    new AdminMenuBuilder(session, COMMAND_NAME)
      .setButtons((menu) => getRegionButtons(menu, regionId))
      .setEmbeds((menu) => getRegionMenuEmbeds(menu, regionId))
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .build(),
};

const getRegionButtons = async (
  _menu: AdminMenu,
  regionId: string
): Promise<MenuButtonConfig<AdminMenu>[]> => {
  const region = await findRegion({ _id: regionId });

  const subMenuButtons: { id: string; command: string }[] = [
    { id: 'Pokedex', command: MANAGE_POKEDEX_COMMAND_NAME },
    { id: 'Moves', command: 'moves' },
    { id: 'Progression', command: 'progression' },
    { id: 'Locations', command: 'locations' },
    { id: 'Transportation', command: 'transportation' },
    { id: 'Quests', command: 'quests' },
    { id: 'Shops', command: 'shops' },
    { id: 'Mechanics', command: 'mechanics' },
    { id: 'Graphics', command: 'graphics' },
  ];

  return [
    {
      label: region.deployed ? 'Undeploy' : 'Deploy',
      disabled: !region.deployable,
      fixedPosition: 'start',
      style: region.deployed ? ButtonStyle.Danger : ButtonStyle.Success,
      onClick: async (menu) => {
        region.deployed = !region.deployed;
        await upsertRegion({ _id: region._id }, region);
        menu.prompt = `Successfully ${
          region.deployed ? 'deployed' : 'undeployed'
        } the ${region.name} Region`;
        await menu.refresh();
      },
    },
    ...subMenuButtons.map(({ id, command }, idx) => ({
      label: `${idx + 1}`,
      style: ButtonStyle.Primary,
      onClick: async (menu: AdminMenu) => openMenu(menu, command, regionId),
      id,
    })),
  ];
};
