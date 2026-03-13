/**
 * Built-in action factories.
 *
 * These return Action functions that perform common navigation operations.
 * They integrate with the MenuContext to delegate to session methods.
 */
import type { Action, MenuContextLike } from '../types/common';

/**
 * Navigate to another registered menu.
 * @example action: goTo('manage-prefixes')
 * @example action: goTo('edit-slot', { regionId: '123', slotNo: '5' })
 */
export function goTo(
  menuId: string,
  options?: Record<string, unknown>
): Action {
  return async (ctx: MenuContextLike) => {
    await ctx.goTo(menuId, options);
  };
}

/**
 * Pop the navigation stack and return to the previous menu.
 * Optionally pass a result to the parent's onComplete callback.
 * @example action: goBack()
 * @example action: goBack({ selectedPokemon: 'Pikachu' })
 */
export function goBack(result?: unknown): Action {
  return async (ctx: MenuContextLike) => {
    await ctx.goBack(result);
  };
}

/**
 * End the session entirely.
 * @example action: closeMenu()
 */
export function closeMenu(): Action {
  return async (ctx: MenuContextLike) => {
    await ctx.close();
  };
}

/**
 * Open a modal dialog. The modal is defined on the menu via .setModal().
 * This action triggers the modal display.
 * @example action: openModal()
 * @example action: openModal('create-location')
 */
export function openModal(modalId?: string): Action {
  return async (ctx: MenuContextLike) => {
    // The engine handles modal display via the menu instance
    // This is a signal to the session's action handler
    const menu = ctx.menu as { openModal?: (id?: string) => Promise<void> };
    if (menu.openModal) {
      await menu.openModal(modalId);
    }
  };
}
