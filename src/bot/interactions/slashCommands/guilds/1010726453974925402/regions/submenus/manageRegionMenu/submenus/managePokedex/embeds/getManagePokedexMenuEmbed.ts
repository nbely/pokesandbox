import { EmbedBuilder } from "discord.js";

import { AdminMenu } from "@bot/classes/adminMenu";

const getManageRegionMenuEmbed = (menu: AdminMenu) => {

  const startIndex: number = (menu.currentPage - 1) * menu.paginationOptions.quantityPerPage;
  let endIndex: number = menu.currentPage * menu.paginationOptions.quantityPerPage;
    if (endIndex > menu.region.pokedex.length) {
    endIndex = menu.region.pokedex.length;
  }
  const entryRange: string = startIndex === endIndex
    ? `${startIndex}`
    : `${startIndex + 1}-${endIndex + 1}`;

  const pokedexLines: string[] = [];
  for (let i = startIndex; i < endIndex; i++) {
    const pokemon = menu.region.pokedex[i];
    pokedexLines.push(
      `\n${i + 1}. ${pokemon.name}`,
    );
  }
  if (pokedexLines.length === 0) {
    pokedexLines.push(
      "\nNo Pokédex entries found.",
    );
  }

  const fields = [{
    name: "\u200b",
    value: pokedexLines.join(""),
    inline: true,
  }];

  return new EmbedBuilder()
    .setColor("Gold")
    .setAuthor({
      name: `${menu.region.name} Pokédex Manager:`,
      iconURL: menu.commandInteraction.guild?.iconURL() || undefined,
    })
    .setDescription(
      "Enter a number and Pokémon name (space-separated) to add a Pokémon to a Pokédex slot, \
      or enter just a number to modify a Pokédex slot.",
    )
    .addFields(fields)
    .setFooter({
      text: `Showing Pokédex entries ${entryRange} of ${menu.region.pokedex.length}`
    })
    .setTimestamp();
};

export default getManageRegionMenuEmbed;
