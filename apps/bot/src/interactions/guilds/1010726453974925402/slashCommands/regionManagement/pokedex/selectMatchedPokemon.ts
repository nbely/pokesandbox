import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';
import { z } from 'zod';

import { AdminMenuBuilderV2, type AdminMenuContext } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import { onlyAdminRoles, parseCommandOptions } from '@bot/utils';
import type { ButtonInputConfig } from '@flowcord/v2';

import { getSelectMatchedPokemonEmbeds } from './pokedex.embeds';
import type { PokedexMenuState } from './types';

const COMMAND_NAME = 'select-matched-pokemon';
export const SELECT_MATCHED_POKEMON_COMMAND_NAME = COMMAND_NAME;

const selectMatchedPokemonCommandOptionsSchema = z.object({
  regionId: z.string().min(1),
  matchedDexEntryIds: z.array(z.string().min(1)).min(1),
});

export const SelectMatchedPokemonCommand: ISlashCommand = {
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
  createMenuV2: (session, options) => {
    const { matchedDexEntryIds } = parseCommandOptions(
      selectMatchedPokemonCommandOptionsSchema,
      options
    );

    return new AdminMenuBuilderV2<PokedexMenuState>(
      session,
      COMMAND_NAME,
      options
    )
      .setButtons((ctx) =>
        getSelectMatchedPokemonButtons(ctx, matchedDexEntryIds)
      )
      .setCancellable()
      .setEmbeds((ctx) =>
        getSelectMatchedPokemonEmbeds(ctx, matchedDexEntryIds)
      )
      .build();
  },
};

const getSelectMatchedPokemonButtons = async (
  _ctx: AdminMenuContext<PokedexMenuState>,
  matchedDexEntryIds: string[]
): Promise<ButtonInputConfig<AdminMenuContext<PokedexMenuState>>[]> =>
  matchedDexEntryIds.map((dexEntryId, idx) => ({
    id: dexEntryId,
    label: `${idx + 1}`,
    style: ButtonStyle.Primary,
    action: async (ctx) => {
      await ctx.complete(dexEntryId);
    },
  }));
