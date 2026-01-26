import { DexEntry } from '@shared/models';

type PokemonSearchResult = {
  exactMatch?: DexEntry;
  potentialMatches: DexEntry[];
};

export const searchPokemon = async (
  serverId: string,
  searchName: string
): Promise<PokemonSearchResult> => {
  let exactMatch: DexEntry | undefined;
  const potentialMatches: DexEntry[] = await DexEntry.find({
    $and: [
      { baseSpecies: undefined },
      {
        $or: [
          { name: { $regex: new RegExp(searchName, 'i') } },
          { showdownName: searchName.toLowerCase().replace(/[^a-zA-Z]/g, '') },
        ],
      },
      { $or: [{ isCanon: true }, { originServer: serverId }] },
    ],
  });
  potentialMatches.sort((a, b) => a.num - b.num);

  if (potentialMatches.length < 1) {
    return { potentialMatches };
  }

  for (const pokemon of potentialMatches) {
    if (
      pokemon.name.toLowerCase().replace(/[^a-zA-Z]/g, '') ===
      searchName.toLowerCase().replace(/[^a-zA-Z]/g, '')
    ) {
      exactMatch = pokemon;
      break;
    }
  }

  return {
    exactMatch,
    potentialMatches,
  };
};
