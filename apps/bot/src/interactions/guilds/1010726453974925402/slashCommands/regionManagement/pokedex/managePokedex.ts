import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { AdminMenu, AdminMenuBuilder } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';
import { findRegion } from '@shared';
import { getManagePokedexMenuEmbeds } from './pokedex.embeds';

const COMMAND_NAME = 'manage-pokedex';
export const MANAGE_POKEDEX_COMMAND_NAME = COMMAND_NAME;

export const ManagePokedexCommand: ISlashCommand<AdminMenu> = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Manage the Pokédex for one of your PokéSandbox Regions')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, regionId) =>
    new AdminMenuBuilder(session, COMMAND_NAME)
      .setEmbeds((menu) => getManagePokedexMenuEmbeds(menu, regionId))
      .setCancellable()
      .setListPagination({
        quantityItemsPerPage: 50,
        nextButton: { style: ButtonStyle.Primary },
        previousButton: { style: ButtonStyle.Primary },
        getTotalQuantityItems: async () => {
          const region = await findRegion({ _id: regionId });
          return region.pokedex.length;
        },
      })
      .setReturnable()
      .setTrackedInHistory()
      .build(),
};
