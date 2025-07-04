import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { AdminMenu, AdminMenuBuilder, MenuButtonConfig } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles } from '@bot/utils';
import { getSelectMatchedPokemonEmbeds } from './pokedex.embeds';

const COMMAND_NAME = 'select-matched-pokemon';
export const SELECT_MATCHED_POKEMON_COMMAND_NAME = COMMAND_NAME;

export const SelectMatchedPokemonCommand: ISlashCommand<AdminMenu> = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  ignore: true,
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Select a matched Pokémon from a search')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, regionId, ...matchedDexEntryIds) =>
    new AdminMenuBuilder(session, COMMAND_NAME)
      .setButtons((menu) =>
        getSelectMatchedPokemonButtons(menu, matchedDexEntryIds)
      )
      .setCancellable()
      .setEmbeds((menu) =>
        getSelectMatchedPokemonEmbeds(menu, matchedDexEntryIds)
      )
      .setReturnable()
      .setTrackedInHistory()
      .build(),
};

const getSelectMatchedPokemonButtons = async (
  _menu: AdminMenu,
  matchedDexEntryIds: string[]
): Promise<MenuButtonConfig<AdminMenu>[]> => {
  return matchedDexEntryIds.map((id, idx) => ({
    id,
    label: `${idx + 1}`,
    style: ButtonStyle.Primary,
    onClick: async (menu) => {
      await menu.session.goBack();
    },
  }));
};
