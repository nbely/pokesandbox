import { Session } from '../session/Session';
import { MenuCommandOptions } from '../types';
import { Menu } from './Menu';

/**
 * Helper class for working with continuation callbacks in multi-menu workflows
 */
export class MenuWorkflow {
  public static async openMenu<M extends Menu>(
    menu: M,
    command: string,
    options?: MenuCommandOptions
  ) {
    const newMenu = await menu.session.flowcord.registry.getMenuFactory(
      command
    )?.(menu.session, options);
    if (!newMenu) {
      return await menu.session.handleError(
        new Error(`Could not open menu: ${command}`)
      );
    }
    await menu.session.next(newMenu, options);
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
    onComplete: (session: Session, result: TResult) => Promise<void>,
    commandOptions?: MenuCommandOptions
  ): Promise<void> {
    // Register the continuation callback and open the sub-menu
    currentMenu.session.registerContinuation(
      subMenuName,
      onComplete as (session: Session, result: unknown) => Promise<void>
    );
    return this.openMenu(currentMenu, subMenuName, commandOptions);
  }

  /**
   * Complete a menu with a result and return to the previous menu
   */
  public static async completeWithResult<TResult = unknown>(
    menu: Menu,
    result: TResult
  ): Promise<void> {
    await menu.complete(result);
  }
}
