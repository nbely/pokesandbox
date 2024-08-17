import { AdminMenu } from "@bot/classes/adminMenu";
import { IDexEntry } from "@models/dexentry.model";
import { findDexEntry } from "@services/dexentry.service";

import setEditPokedexSlotComponents from "../components/setEditPokedexSlotComponents";
import getEditPokedexSlotEmbed from "../embeds/getEditPokedexSlotEmbed";

const handleEditPokedexSlot = async (
  menu: AdminMenu,
  pokedexNo: number
): Promise<void> => {
  menu.currentPage = 1;

  const dexSlot = menu.region.pokedex[pokedexNo - 1];
  const dexEntry: IDexEntry | null = await findDexEntry({ _id: dexSlot?.id });

  if (!dexEntry) {
    menu.handleError(
      `Problem encountered while fetching Pokédex data for ${dexSlot?.name}.`
    );
    return;
  }

  while (!menu.isBackSelected && !menu.isCancelled) {
    menu.prompt = "";

    setEditPokedexSlotComponents(menu);
    menu.embeds = [getEditPokedexSlotEmbed(menu, pokedexNo, dexEntry)];

    await menu.updateEmbedMessage();

    const selection = await menu.awaitButtonMenuInteraction(120_000);

    if (selection === undefined) continue;

    // TODO: Implement the logic for each selection
    switch (selection) {
      case "Customize":
        console.log("Customize selected");
        break;
      case "Swap":
        console.log("Swap selected");
        break;
      case "Remove":
        console.log("Remove selected");
        break;
      default:
        menu.handleError(new Error("Invalid Option Selected"));
    }
  }
  menu.isBackSelected = false;
};

export default handleEditPokedexSlot;
