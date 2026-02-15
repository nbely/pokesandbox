import { Session } from '../Session/Session';
import { MenuCommandOptions } from '../types';
import { Menu } from './Menu';

/**
 * Helper class for working with continuation callbacks in multi-menu workflows
 */
export class MenuWorkflow {
  public static async openMenu<M extends Menu<any>>(
    menu: M,
    command: string,
    options?: MenuCommandOptions
  ) {
    const slashCommand = menu.client.slashCommands.get(command);
    if (!slashCommand) {
      throw new Error(`Slash command '${command}' not found.`);
    }
    if (!slashCommand.createMenu) {
      throw new Error(`Slash command '${command}' does not have a createMenu method.`);
    }
    const pokedexMenu = await slashCommand.createMenu(menu.session, options);
    await menu.session.next(pokedexMenu, options);
  }

  /**
   * Open a sub-menu and register a continuation callback for when it completes
   * @param currentMenu The current menu
   * @param subMenuName The name of the sub-menu to open
   * @param onComplete Callback to execute when the sub-menu completes
   * @param commandArgs Arguments to pass to the sub-menu command
   */
  public static async openSubMenuWithContinuation<
    TMenu extends Menu<any>,
    TResult = unknown
  >(
    currentMenu: TMenu,
    subMenuName: string,
    onComplete: (session: Session, result: unknown) => Promise<void>,
    commandOptions?: MenuCommandOptions
  ): Promise<void> {
    // Register the continuation callback and open the sub-menu
    currentMenu.session.registerContinuation(subMenuName, onComplete);
    return this.openMenu(currentMenu, subMenuName, commandOptions);
  }

  /**
   * Complete a menu with a result and return to the previous menu
   * @param menu The menu to complete
   * @param result The result to pass to any continuation callbacks
   */
  public static async completeAndReturn<TResult = unknown>(
    menu: Menu<any>,
    result?: TResult
  ): Promise<void> {
    // Mark the menu as completed with the result
    await menu.complete(result);
    await menu.session.goBack();
  }
}
