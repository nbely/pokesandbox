import { EmbedBuilder, EmbedField } from "discord.js";

import { AdminMenu } from "@bot/classes/adminMenu";
import type { IDexEntry } from "@models/dexentry.model";

const getSelectMatchedPokemonEmbed = (
  menu: AdminMenu,
  pokedexNo: number,
  matchedPokemon: IDexEntry[]
): EmbedBuilder => {
  const matchedOptions: string[] = [];

  for (
    let i = menu.paginationOptions._currentStartIndex;
    i < menu.paginationOptions._currentEndIndex;
    i++
  ) {
    matchedOptions.push(`\n${i + 1}. ${matchedPokemon[i].name}`);
  }

  const fields: EmbedField[] = [];

  if (menu.paginationOptions._currentQuantity <= 10) {
    fields.push({
      name: "\u200b",
      value: matchedOptions.slice().join(""),
      inline: true,
    });
  } else {
    const half = Math.ceil(menu.paginationOptions._currentQuantity / 2);
    fields.push({
      name: "\u200b",
      value: matchedOptions.slice(0, half).join(""),
      inline: true,
    });
    fields.push({
      name: "\u200b",
      value: matchedOptions.slice(half).join(""),
      inline: true,
    });
  }

  const embed = new EmbedBuilder()
    .setColor("Gold")
    .setAuthor({
      name: `${menu.region.name} Pokédex Slot #${pokedexNo}`,
      iconURL: menu.commandInteraction.guild?.iconURL() || undefined,
    })
    .setDescription(menu.description)
    .addFields(fields)
    .setFooter({
      text: `Showing matched options ${menu.paginationOptions._currentRange} of ${menu.paginationOptions.totalQuantity}`,
    })
    .setTimestamp();

  return embed;
};

export default getSelectMatchedPokemonEmbed;
