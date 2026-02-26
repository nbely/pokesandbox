import {
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';

import { getAssertedCachedRegion, saveRegion } from '@bot/cache';
import {
  AdminMenu,
  AdminMenuBuilder,
  MenuButtonConfig,
  MenuWorkflow,
} from '@bot/classes';
import type { ISlashCommand } from '@bot/structures/interfaces';
import {
  assertOptions,
  handleRegionAutocomplete,
  onlyAdminRoles,
  searchPokemon,
} from '@bot/utils';
import { DexEntry, type Region } from '@shared/models';

import {
  getAddPokedexSlotEmbeds,
  getEditPokedexSlotEmbeds,
} from './pokedex.embeds';
import { SELECT_MATCHED_POKEMON_COMMAND_NAME } from './selectMatchedPokemon';

const COMMAND_NAME = 'edit-pokedex-slot';
export const EDIT_POKEDEX_SLOT_COMMAND_NAME = COMMAND_NAME;

type EditPokedexSlotCommandOptions = {
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

const handleAddPokemonToSlot = async (
  menu: AdminMenu<EditPokedexSlotCommandOptions>,
  regionId: string,
  pokedexNo: string,
  pokemonName: string
) => {
  const server = await menu.getServer();
  const region = await menu.getRegion(regionId);

  const { exactMatch, potentialMatches } = await searchPokemon(
    server._id.toString(),
    pokemonName
  );

  if (exactMatch) {
    await handlePokemonSelected(menu, exactMatch, region, pokedexNo);
    return;
  }

  if (potentialMatches.length) {
    return MenuWorkflow.openSubMenuWithContinuation(
      menu,
      SELECT_MATCHED_POKEMON_COMMAND_NAME,
      async (_session, selectedPokemonId: string) => {
        const selectedPokemon = potentialMatches.find(
          (match) => match._id.toString() === selectedPokemonId
        );

        if (!selectedPokemon) {
          menu.prompt = `Selected Pokémon not found. Please try again.`;
          return menu.refresh();
        }

        await handlePokemonSelected(menu, selectedPokemon, region, pokedexNo);
      },
      {
        regionId: region._id.toString(),
        matchedDexEntryIds: potentialMatches.map((match) =>
          match._id.toString()
        ),
      }
    );
  }

  menu.prompt = `No Pokémon found with the name "${pokemonName}". Please try again.`;
  return menu.refresh();
};

const handlePokemonSelected = async (
  menu: AdminMenu<EditPokedexSlotCommandOptions>,
  selectedPokemon: DexEntry,
  region: Region,
  pokedexNo: string
) => {
  if (region.pokedex.some((pkmn) => pkmn?.id.equals(selectedPokemon._id))) {
    menu.prompt = `The Pokémon "${selectedPokemon.name}" is already in the Pokédex. Please choose a different Pokémon.`;
    return menu.refresh();
  } else {
    region.pokedex[+pokedexNo - 1] = {
      id: selectedPokemon._id,
      name: selectedPokemon.name,
    };
    await saveRegion(region);
    return menu.hardRefresh();
  }
};
