import { EmbedBuilder } from 'discord.js';

import type { AdminMenu } from '@bot/classes';

const getAddPokedexSlotEmbed = (menu: AdminMenu, pokedexNo: number) => {
  return new EmbedBuilder()
    .setColor('Gold')
    .setAuthor({
      name: `${menu.region.name} Pokédex Slot #${pokedexNo}`,
      iconURL: menu.commandInteraction.guild?.iconURL() || undefined,
    })
    .setDescription(menu.description)
    .setTimestamp();
};

export default getAddPokedexSlotEmbed;
