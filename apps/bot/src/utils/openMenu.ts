import { Menu } from '@bot/classes';

export async function openMenu<M extends Menu>(
  menu: M,
  command: string,
  ...params: string[]
) {
  const pokedexMenu = await menu.client.slashCommands
    .get(command)
    .createMenu(menu.session, ...params);
  await menu.session.next(pokedexMenu, params);
}
