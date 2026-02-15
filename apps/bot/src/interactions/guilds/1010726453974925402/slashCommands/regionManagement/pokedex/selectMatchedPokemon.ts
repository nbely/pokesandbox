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

import { getSelectMatchedPokemonEmbeds } from './pokedex.embeds';

const COMMAND_NAME = 'select-matched-pokemon';
export const SELECT_MATCHED_POKEMON_COMMAND_NAME = COMMAND_NAME;

type SelectMatchedPokemonCommandOptions = {
  regionId: string;
  matchedDexEntryIds: string[];
};
type SelectMatchedPokemonCommand = ISlashCommand<
  AdminMenu<any>,
  SelectMatchedPokemonCommandOptions
>;

export const SelectMatchedPokemonCommand: SelectMatchedPokemonCommand = {
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
  createMenu: async (session, options) => {
    if (!options) {
      throw new Error('Options are required');
    }
    return new AdminMenuBuilder(session, COMMAND_NAME)
      .setButtons((menu) =>
        getSelectMatchedPokemonButtons(menu, options.matchedDexEntryIds)
      )
      .setCancellable()
      .setEmbeds((menu) =>
        getSelectMatchedPokemonEmbeds(menu, options.matchedDexEntryIds)
      )
      .build();
  },
} as ISlashCommand<any, SelectMatchedPokemonCommandOptions>;

const getSelectMatchedPokemonButtons = async (
  _menu: AdminMenu,
  matchedDexEntryIds: string[]
): Promise<MenuButtonConfig[]> =>
  matchedDexEntryIds.map((dexEntryId, idx) => ({
    id: dexEntryId,
    label: `${idx + 1}`,
    style: ButtonStyle.Primary,
    onClick: async (menu) => {
      await MenuWorkflow.completeAndReturn(menu, dexEntryId);
    },
  }));
