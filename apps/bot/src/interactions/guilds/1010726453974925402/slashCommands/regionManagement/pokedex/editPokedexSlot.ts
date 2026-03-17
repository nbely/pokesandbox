import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';
import { z } from 'zod';

import { getAssertedCachedRegion, saveRegion } from '@bot/cache';
import { AdminMenuBuilder, type AdminMenuContext } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import {
  handleRegionAutocomplete,
  onlyAdminRoles,
  parseCommandOptions,
} from '@bot/utils';
import type { Region } from '@shared/models';
import type { ButtonInputConfig } from '@flowcord';

import {
  getAddPokedexSlotEmbeds,
  getEditPokedexSlotEmbeds,
} from './pokedex.embeds';
import { handleAddPokemonToSlot } from './pokedexHelperFunctions';
import type { PokedexMenuState } from './types';

const COMMAND_NAME = 'edit-pokedex-slot';
export const EDIT_POKEDEX_SLOT_COMMAND_NAME = COMMAND_NAME;

const editPokedexSlotCommandOptionsSchema = z.object({
  region_id: z.string().min(1),
  pokedex_no: z
    .union([z.string(), z.number()])
    .transform((value) => `${value}`)
    .refine((value) => {
      const pokedexNumber = Number(value);
      return (
        Number.isInteger(pokedexNumber) &&
        pokedexNumber >= 1 &&
        pokedexNumber <= 1500
      );
    }, 'Must be an integer between 1 and 1500'),
});

export const EditPokedexSlotCommand: ISlashCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  autocomplete: handleRegionAutocomplete,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Add a Pokémon to a regional Pokédex slot')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('region_id')
        .setDescription('The region to manage')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('pokedex_no')
        .setDescription('The Pokédex slot number')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1500)
    ),
  createMenu: async (session, options) => {
    const { region_id, pokedex_no } = parseCommandOptions(
      editPokedexSlotCommandOptionsSchema,
      options
    );
    const region = await getAssertedCachedRegion(region_id);

    const builder = new AdminMenuBuilder<PokedexMenuState>(
      session,
      COMMAND_NAME,
      options
    )
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory();

    if (!region.pokedex[+pokedex_no - 1]) {
      // handle add pokedex slot
      builder
        .setEmbeds((ctx) => getAddPokedexSlotEmbeds(ctx, region_id, pokedex_no))
        .setMessageHandler((ctx, response) =>
          handleAddPokemonToSlot(ctx, region_id, pokedex_no, response)
        );
    } else {
      builder
        .setEmbeds((ctx) =>
          getEditPokedexSlotEmbeds(ctx, region_id, pokedex_no)
        )
        .setButtons((ctx) =>
          getEditPokedexSlotButtons(ctx, region_id, pokedex_no)
        );
    }

    return builder.build();
  },
};

const getEditPokedexSlotButtons = async (
  _ctx: AdminMenuContext<PokedexMenuState>,
  regionId: string,
  pokedexNo: string
): Promise<ButtonInputConfig<AdminMenuContext<PokedexMenuState>>[]> => {
  return [
    {
      label: 'Customize',
      style: ButtonStyle.Primary,
      action: async (ctx) =>
        ctx.goTo('customize-pokedex-slot', {
          regionId,
          pokedexNo,
        }),
    },
    {
      label: 'Swap',
      style: ButtonStyle.Primary,
      action: async (ctx) =>
        ctx.goTo('swap-pokedex-slot', {
          regionId,
          pokedexNo,
        }),
    },
    {
      label: 'Remove',
      style: ButtonStyle.Danger,
      action: async (ctx) => {
        const region = await ctx.admin.getRegion(regionId);
        const pokedexIndex = +pokedexNo - 1;

        removePokedexSlot(region, pokedexIndex);
        await saveRegion(region);
        await ctx.hardRefresh();
      },
    },
  ];
};

const removePokedexSlot = (region: Region, pokedexIndex: number): void => {
  region.pokedex[pokedexIndex] = null;
  removeNullsFromEndOfPokedex(region);
};

const removeNullsFromEndOfPokedex = (region: Region): void => {
  while (region.pokedex[region.pokedex.length - 1] === null) {
    region.pokedex.pop();
  }
};
