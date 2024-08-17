import { EmbedBuilder } from "discord.js";

import { AdminMenu } from "@bot/classes/adminMenu";
import type { IDexEntry } from "@models/dexentry.model";

const getEditPokedexSlotEmbed = (
  menu: AdminMenu,
  pokedexNo: number,
  dexEntry: IDexEntry
) => {
  // TODO: Decide on the final format of the embed
  const embed = new EmbedBuilder()
    .setColor("Gold")
    .setAuthor({
      name: `#${pokedexNo}: ${dexEntry.name} - The ${dexEntry.classification} Pokémon`,
      iconURL: menu.commandInteraction.guild?.iconURL() || undefined,
    })
    .setDescription(
      `Types: ${dexEntry.types.join(", ")}
      Abilities: ${dexEntry.abilities[0]}${
        dexEntry.abilities[1] ? `/${dexEntry.abilities[1]}` : ""
      }${dexEntry.abilities.H ? ` (H: ${dexEntry.abilities.H})` : ""}`
    )
    .setTimestamp();

  const thumbnail = dexEntry.sprites.g5?.bw?.normal.front;
  if (thumbnail) {
    embed.setThumbnail(thumbnail);
  }

  return embed;
};

export default getEditPokedexSlotEmbed;
