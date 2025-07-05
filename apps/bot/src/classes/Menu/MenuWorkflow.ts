import { Session } from '../Session/Session';
import { Menu } from './Menu';

/**
 * Helper class for working with continuation callbacks in multi-menu workflows
 */
export class MenuWorkflow {
  public static async openMenu<M extends Menu>(
    menu: M,
    command: string,
    ...params: string[]
  ) {
    const pokedexMenu = await menu.client.slashCommands
      .get(command)
      .createMenu(menu.session, ...params);
    await menu.session.next(pokedexMenu, params);
  }

  /**
   * Open a sub-menu and register a continuation callback for when it completes
   * @param currentMenu The current menu
   * @param subMenuName The name of the sub-menu to open
   * @param onComplete Callback to execute when the sub-menu completes
   * @param commandArgs Arguments to pass to the sub-menu command
   */
  public static async openSubMenuWithContinuation<
    TMenu extends Menu,
    TResult = unknown
  >(
    currentMenu: TMenu,
    subMenuName: string,
    commandArgs: string[],
    onComplete: (session: Session, result: TResult) => Promise<void>
  ): Promise<void> {
    // Register the continuation callback and open the sub-menu
    currentMenu.session.registerContinuation(subMenuName, onComplete);
    return this.openMenu(currentMenu, subMenuName, ...commandArgs);
  }

  /**
   * Complete a menu with a result and return to the previous menu
   * @param menu The menu to complete
   * @param result The result to pass to any continuation callbacks
   */
  public static async completeAndReturn<TResult = unknown>(
    menu: Menu,
    result?: TResult
  ): Promise<void> {
    // Mark the menu as completed with the result
    await menu.complete(result);
    await menu.session.goBack();
  }
}

export default MenuWorkflow;
