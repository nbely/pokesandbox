import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';
import { z } from 'zod';

import {
  getAssertedCachedDexEntry,
  getAssertedCachedRegion,
  saveRegion,
} from '@bot/cache';
import { AdminMenuBuilder, AdminMenuContext } from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import {
  handleRegionAutocomplete,
  onlyAdminRoles,
  parseCommandOptions,
} from '@bot/utils';

import { getPokedexSlotCustomizeEmbeds } from './pokedex.embeds';
import { Region } from '@shared/models';
import { Types } from 'mongoose';
import { ButtonInputConfig } from '@flowcord/core';
import { PokedexSlotCustomizeMenuState } from './types';
import { checkHasOtherFormes } from './pokedexHelperFunctions';

const COMMAND_NAME = 'pokedex-slot-customize';
export const POKEDEX_SLOT_CUSTOMIZE_COMMAND_NAME = COMMAND_NAME;

const customizePokedexSlotCommandOptionsSchema = z.object({
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

export const PokedexSlotCustomizeCommand: ISlashCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  autocomplete: handleRegionAutocomplete,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription(
      'Customize the form of a Pokémon in a regional Pokédex slot'
    )
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
      customizePokedexSlotCommandOptionsSchema,
      options
    );
    const region = await getAssertedCachedRegion(region_id);
    const isSlotFilled = !!region.pokedex[+pokedex_no - 1];
    const hasOtherFormes = await checkHasOtherFormes(region_id, pokedex_no);
    const slot = region.pokedex[+pokedex_no - 1];
    const dexEntry = await getAssertedCachedDexEntry(slot?.id);
    const formsMap = new Map<string, string>();
    dexEntry.formeOrder?.forEach((form) =>
      formsMap.set(form.id.toString(), form.name)
    );

    if (!isSlotFilled) {
      throw new Error(`No Pokémon found in Pokédex slot ${pokedex_no}.`);
    } else if (!hasOtherFormes) {
      throw new Error(
        `The Pokémon in Pokédex slot ${pokedex_no} has no alternate formes to customize.`
      );
    }

    return new AdminMenuBuilder<PokedexSlotCustomizeMenuState>(
      session,
      COMMAND_NAME,
      options
    )
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory()
      .setEmbeds((ctx) =>
        getPokedexSlotCustomizeEmbeds(ctx, region_id, pokedex_no, formsMap)
      )
      .setButtons((ctx) =>
        getPokedexSlotCustomizeButtons(ctx, region_id, pokedex_no, formsMap)
      )
      .build();
  },
};

const getPokedexSlotCustomizeButtons = async (
  _ctx: AdminMenuContext<PokedexSlotCustomizeMenuState>,
  regionId: string,
  pokedexNo: string,
  formsMap: Map<string, string>
): Promise<
  ButtonInputConfig<AdminMenuContext<PokedexSlotCustomizeMenuState>>[]
> => {
  const region = await getAssertedCachedRegion(regionId);
  const slot = region.pokedex[+pokedexNo - 1];
  if (!slot) {
    throw new Error(`Pokédex slot ${pokedexNo} is empty.`);
  }
  const dexEntry = await getAssertedCachedDexEntry(slot.id);
  dexEntry.formeOrder?.forEach((form) =>
    formsMap.set(form.id.toString(), form.name)
  );

  const buttons: ButtonInputConfig<
    AdminMenuContext<PokedexSlotCustomizeMenuState>
  >[] =
    dexEntry.otherFormes?.map((form) => {
      const isFormAvailable =
        slot.includedForms?.some((includedForm) =>
          includedForm.id.equals(form.id)
        ) || false;
      return {
        label: `${form.name}`,
        style: isFormAvailable ? ButtonStyle.Success : ButtonStyle.Danger,
        disabled:
          slot.includedForms?.length === 1 && slot.isBaseFormNotIncluded,
        action: async (
          ctx: AdminMenuContext<PokedexSlotCustomizeMenuState>
        ) => {
          const slotIndex = +pokedexNo - 1;
          const slot = region.pokedex[slotIndex];
          if (isFormAvailable) {
            slot?.includedForms?.splice(
              slot.includedForms.findIndex((f) => f.id.equals(form.id)),
              1
            );
          } else {
            slot?.includedForms?.push({
              id: form.id,
              ordinal: slot.includedForms.length,
            });
          }
          await saveRegion(region);
          await ctx.hardRefresh();
        },
      };
    }) || [];
  buttons.unshift(toggleBaseFormButton(slot, region));

  return buttons;
};

const toggleBaseFormButton = (
  slot: {
    name: string;
    id: Types.ObjectId;
    isBaseFormNotIncluded?: boolean;
    baseFormOrdinal?: number;
    includedForms?: { id: Types.ObjectId; ordinal: number }[];
  },
  region: Region
): ButtonInputConfig<AdminMenuContext<PokedexSlotCustomizeMenuState>> => {
  return {
    label: `${slot.name}`,
    style: slot.isBaseFormNotIncluded
      ? ButtonStyle.Danger
      : ButtonStyle.Success,
    disabled:
      slot.includedForms &&
      slot.includedForms.length < 1 &&
      !slot.isBaseFormNotIncluded,
    action: async (menu) => {
      slot.isBaseFormNotIncluded = !slot.isBaseFormNotIncluded;
      await saveRegion(region);
      await menu.hardRefresh();
    },
  };
};
