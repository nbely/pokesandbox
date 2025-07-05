import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import {
  AdminMenu,
  AdminMenuBuilder,
  MenuButtonConfig,
  MenuWorkflow,
} from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';
import { getEditPokedexSlotEmbeds } from './pokedex.embeds';
import { findRegion, upsertRegion } from '@shared';

const COMMAND_NAME = 'edit-pokedex-slot';
export const EDIT_POKEDEX_SLOT_COMMAND_NAME = COMMAND_NAME;

export const EditPokedexSlotCommand: ISlashCommand<AdminMenu> = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Edit a regional Pokédex slot')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, regionId, pokedexNo) =>
    new AdminMenuBuilder(session, COMMAND_NAME)
      .setButtons((menu) =>
        getEditPokedexSlotButtons(menu, regionId, pokedexNo)
      )
      .setCancellable()
      .setEmbeds((menu) => getEditPokedexSlotEmbeds(menu, regionId, pokedexNo))
      .setReturnable()
      .setTrackedInHistory()
      .build(),
};

const getEditPokedexSlotButtons = async (
  _menu: AdminMenu,
  regionId: string,
  pokedexNo: string
): Promise<MenuButtonConfig<AdminMenu>[]> => {
  return [
    {
      label: 'Customize',
      style: ButtonStyle.Primary,
      onClick: async (menu) =>
        MenuWorkflow.openMenu(
          menu,
          'customize-pokedex-slot',
          regionId,
          pokedexNo
        ),
    },
    {
      label: 'Swap',
      style: ButtonStyle.Primary,
      onClick: async (menu) =>
        MenuWorkflow.openMenu(menu, 'swap-pokedex-slot', regionId, pokedexNo),
    },
    {
      label: 'Remove',
      style: ButtonStyle.Danger,
      onClick: async (menu) => {
        const region = await findRegion({ _id: regionId });
        const pokedexIndex = +pokedexNo - 1;

        region.pokedex[pokedexIndex] = null;
        await upsertRegion({ _id: regionId }, region);
        await menu.session.goBack();
      },
    },
  ];
};
