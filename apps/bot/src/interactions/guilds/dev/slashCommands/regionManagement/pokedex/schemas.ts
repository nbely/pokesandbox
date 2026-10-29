import { z } from 'zod';

export const pokedexNoCommandOptionsSchema = z.object({
  region_id: z.string().min(1),
  pokedex_no: z
    .union([z.string(), z.number()])
    .transform((value) => `${value}`)
    .refine((value) => {
      const pokedexNumber = Number(value);
      return (
        Number.isInteger(pokedexNumber) &&
        pokedexNumber >= 1 &&
        pokedexNumber <= 1500
      );
    }, 'Must be an integer between 1 and 1500'),
});
