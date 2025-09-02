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
import { onlyAdminRoles, searchPokemon } from '@bot/utils';
import { findRegion, upsertRegion, DexEntry, Region } from '@shared';

import {
  getAddPokedexSlotEmbeds,
  getEditPokedexSlotEmbeds,
} from './pokedex.embeds';
import { SELECT_MATCHED_POKEMON_COMMAND_NAME } from './selectMatchedPokemon';

const COMMAND_NAME = 'edit-pokedex-slot';
export const EDIT_POKEDEX_SLOT_COMMAND_NAME = COMMAND_NAME;

type EditPokedexSlotCommandOptions = {
  regionId: string;
  pokedexNo: string;
};
type EditPokedexSlotCommand = ISlashCommand<
  AdminMenu,
  EditPokedexSlotCommandOptions
>;

export const EditPokedexSlotCommand: EditPokedexSlotCommand = {
  name: COMMAND_NAME,
  anyUserPermissions: ['Administrator'],
  onlyRoles: onlyAdminRoles,
  onlyRolesOrAnyUserPermissions: true,
  returnOnlyRolesError: false,
  command: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Add a Pokémon to a regional Pokédex slot')
    .setContexts(InteractionContextType.Guild),
  createMenu: async (session, options) => {
    const { regionId, pokedexNo } = options;
    const region = await findRegion({ _id: regionId });
    const builder = new AdminMenuBuilder(session, COMMAND_NAME, options)
      .setCancellable()
      .setReturnable()
      .setTrackedInHistory();

    if (!region.pokedex[+pokedexNo - 1]) {
      // handle add pokedex slot
      builder
        .setEmbeds((menu) => getAddPokedexSlotEmbeds(menu, regionId, pokedexNo))
        .setMessageHandler((menu, response) =>
          handleAddPokemonToSlot(menu, region, pokedexNo, response)
        );
    } else {
      builder
        .setEmbeds((menu) =>
          getEditPokedexSlotEmbeds(menu, regionId, pokedexNo)
        )
        .setButtons((menu) =>
          getEditPokedexSlotButtons(menu, regionId, pokedexNo)
        );
    }

    return builder.build();
  },
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
        const region = await findRegion({ _id: regionId });
        const pokedexIndex = +pokedexNo - 1;

        region.pokedex[pokedexIndex] = null;
        await upsertRegion({ _id: regionId }, region);
        await menu.hardRefresh();
      },
    },
  ];
};

const handleAddPokemonToSlot = async (
  menu: AdminMenu,
  region: Region,
  pokedexNo: string,
  pokemonName: string
) => {
  const server = await menu.fetchServer();

  const { exactMatch, potentialMatches } = await searchPokemon(
    server._id.toString(),
    pokemonName
  );

  if (!exactMatch && !potentialMatches.length) {
    menu.prompt = `No Pokémon found with the name "${pokemonName}". Please try again.`;
    return menu.refresh();
  } else if (!exactMatch && !!potentialMatches.length) {
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
  } else {
    // Handle exact match (original logic)
    await handlePokemonSelected(menu, exactMatch, region, pokedexNo);
  }
};

const handlePokemonSelected = async (
  menu: AdminMenu,
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
    await upsertRegion({ _id: region._id }, region);
    return menu.hardRefresh();
  }
};
