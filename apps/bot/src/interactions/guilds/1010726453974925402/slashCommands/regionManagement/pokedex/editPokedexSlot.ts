import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { getAssertedCachedRegion, saveRegion } from '@bot/cache';
import { AdminMenu, AdminMenuBuilder, MenuButtonConfig } from '@bot/classes';
import { MenuWorkflow } from '@flowcord';
import type { ISlashCommand } from '@bot/structures/interfaces';
import {
  assertOptions,
  handleRegionAutocomplete,
  onlyAdminRoles,
} from '@bot/utils';
import { type Region } from '@shared/models';

import {
  getAddPokedexSlotEmbeds,
  getEditPokedexSlotEmbeds,
} from './pokedex.embeds';
import { handleAddPokemonToSlot } from './pokedexHelperFunctions';

const COMMAND_NAME = 'edit-pokedex-slot';
export const EDIT_POKEDEX_SLOT_COMMAND_NAME = COMMAND_NAME;

export type EditPokedexSlotCommandOptions = {
  region_id: string;
  pokedex_no: string;
};
type EditPokedexSlotCommand = ISlashCommand<
  AdminMenu<EditPokedexSlotCommandOptions>,
  EditPokedexSlotCommandOptions
>;

export const EditPokedexSlotCommand: EditPokedexSlotCommand = {
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
  createMenu: async (
    session,
    options: EditPokedexSlotCommandOptions | undefined
  ) => {
    assertOptions(options);
    const { region_id, pokedex_no } = options;
    const region = await getAssertedCachedRegion(region_id);

    const builder = new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory();

    if (!region.pokedex[+pokedex_no - 1]) {
      // handle add pokedex slot
      builder
        .setEmbeds((menu) =>
          getAddPokedexSlotEmbeds(menu, region_id, pokedex_no)
        )
        .setMessageHandler((menu, response) =>
          handleAddPokemonToSlot(menu, region_id, pokedex_no, response)
        );
    } else {
      builder
        .setEmbeds((menu) =>
          getEditPokedexSlotEmbeds(menu, region_id, pokedex_no)
        )
        .setButtons((menu) =>
          getEditPokedexSlotButtons(menu, region_id, pokedex_no)
        );
    }

    return builder.build();
  },
};

const getEditPokedexSlotButtons = async (
  _menu: AdminMenu<EditPokedexSlotCommandOptions>,
  regionId: string,
  pokedexNo: string
): Promise<MenuButtonConfig<AdminMenu<EditPokedexSlotCommandOptions>>[]> => {
  return [
    {
      label: 'Customize',
      style: ButtonStyle.Primary,
      onClick: async (menu) =>
        MenuWorkflow.openMenu(menu, 'customize-pokedex-slot', {
          regionId,
          pokedexNo,
        }),
    },
    {
      label: 'Swap',
      style: ButtonStyle.Primary,
      onClick: async (menu) =>
        MenuWorkflow.openMenu(menu, 'swap-pokedex-slot', {
          regionId,
          pokedexNo,
        }),
    },
    {
      label: 'Remove',
      style: ButtonStyle.Danger,
      onClick: async (menu) => {
        const region = await menu.getRegion(regionId);
        const pokedexIndex = +pokedexNo - 1;

        removePokedexSlot(region, pokedexIndex);
        await saveRegion(region);
        await menu.hardRefresh();
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
