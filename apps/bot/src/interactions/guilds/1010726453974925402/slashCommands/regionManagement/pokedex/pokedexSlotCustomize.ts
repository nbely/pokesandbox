import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

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
import { DexEntry, Region } from '@shared/models';
import { ButtonInputConfig } from '@flowcord/core';
import { Form, PokedexSlotCustomizeMenuState, Slot } from './types';
import { checkHasOtherFormes } from './pokedexHelperFunctions';
import { pokedexNoCommandOptionsSchema } from './schemas';

const COMMAND_NAME = 'customize-pokedex-slot';
export const POKEDEX_SLOT_CUSTOMIZE_COMMAND_NAME = COMMAND_NAME;

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
      pokedexNoCommandOptionsSchema,
      options
    );
    const region = await getAssertedCachedRegion(region_id);
    const isSlotFilled = !!region.pokedex[+pokedex_no - 1];
    const hasOtherFormes = await checkHasOtherFormes(region_id, pokedex_no);
    const slot = region.pokedex[+pokedex_no - 1];
    const dexEntry = await getAssertedCachedDexEntry(slot?.id);
    const formsMap = createFormsMap(dexEntry);

    if (!isSlotFilled) {
      throw new Error(`No Pokémon found in Pokédex slot ${pokedex_no}.`);
    } else if (!hasOtherFormes) {
      throw new Error(
        `${dexEntry.name} has no alternate formes to customize - Pokédex slot ${pokedex_no}.`
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
  formsMap: Map<string, { name: string; ordinal?: number }>
): Promise<
  ButtonInputConfig<AdminMenuContext<PokedexSlotCustomizeMenuState>>[]
> => {
  const region = await getAssertedCachedRegion(regionId);
  const slot = region.pokedex[+pokedexNo - 1];
  if (!slot) {
    throw new Error(`Pokédex slot ${pokedexNo} is empty.`);
  }
  const dexEntry = await getAssertedCachedDexEntry(slot.id);

  const buttons: ButtonInputConfig<
    AdminMenuContext<PokedexSlotCustomizeMenuState>
  >[] = [toggleBaseFormButton(slot, region)];
  buttons.push(
    ...(dexEntry.otherFormes?.map((form) =>
      getFormeButton(slot, form, region, formsMap)
    ) || [])
  );

  return buttons;
};

const getFormeButton = (
  slot: Slot,
  form: Form,
  region: Region,
  formsMap: Map<string, { name: string; ordinal?: number }>
): ButtonInputConfig<AdminMenuContext<PokedexSlotCustomizeMenuState>> => {
  const isFormAvailable = slot.includedForms?.some((includedForm) =>
    includedForm.id.equals(form.id)
  );
  return {
    label: `${form.name}`,
    style: isFormAvailable ? ButtonStyle.Success : ButtonStyle.Danger,
    disabled:
      isFormAvailable &&
      slot.includedForms?.length === 1 &&
      slot.isBaseFormNotIncluded,
    action: async (ctx: AdminMenuContext<PokedexSlotCustomizeMenuState>) => {
      if (isFormAvailable) {
        removeForme(slot, form);
      } else {
        slot?.includedForms?.push({
          id: form.id,
          // giving a unique ordinal based on the form's position in the dexEntry.otherFormes array
          // ordinals are not used yet but the type was built out and it is a required property so this process of assigning unique ordinals was implemented
          ordinal: formsMap.get(form.id.toString())?.ordinal || 1,
        });
      }
      await saveRegion(region);
      await ctx.hardRefresh();
    },
  };
};

const removeForme = (slot: Slot, form: Form) => {
  slot.includedForms?.splice(
    slot.includedForms.findIndex((currentForm) =>
      currentForm.id.equals(form.id)
    ),
    1
  );
};

const toggleBaseFormButton = (
  slot: Slot,
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

const createFormsMap = (
  dexEntry: DexEntry
): Map<string, { name: string; ordinal?: number }> => {
  const formsMap = new Map<string, { name: string; ordinal?: number }>();
  formsMap.set(dexEntry.id.toString(), { name: dexEntry.name });
  dexEntry.otherFormes?.forEach((form, idx) =>
    formsMap.set(form.id.toString(), { name: form.name, ordinal: idx + 1 })
  );
  return formsMap;
};
