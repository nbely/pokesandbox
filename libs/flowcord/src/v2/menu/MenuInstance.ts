/**
 * MenuInstance — Runtime wrapper around a MenuDefinition.
 *
 * Created by the MenuSession for each active menu. Holds the definition,
 * context, state, and delegates rendering/action handling.
 */
import type { MenuContext, MenuInstanceLike } from '../context/MenuContext';
import type { MenuDefinition } from '../registry/MenuRegistry';
import type { Action, ButtonConfig, PaginationState } from '../types/common';
import { StateAccessor } from '../state/StateAccessor';
import { ComponentIdManager } from '../components/ComponentIdManager';

export class MenuInstance<
  TState extends Record<string, unknown> = Record<string, unknown>
> implements MenuInstanceLike
{
  readonly definition: MenuDefinition;
  readonly idManager: ComponentIdManager;
  readonly stateAccessor: StateAccessor<TState>;

  /** Map of component ID → action for routing interactions */
  private readonly _actionMap = new Map<string, Action>();

  /** Current pagination state */
  private _paginationState: PaginationState | null = null;

  constructor(
    definition: MenuDefinition,
    sessionId: string,
    initialState?: TState
  ) {
    this.definition = definition;
    this.idManager = new ComponentIdManager(sessionId, definition.name);
    this.stateAccessor = new StateAccessor<TState>(
      initialState ?? ({} as TState)
    );
  }

  get name(): string {
    return this.definition.name;
  }

  get mode(): 'embeds' | 'layout' {
    return this.definition.mode;
  }

  get paginationState(): PaginationState | null {
    return this._paginationState;
  }

  set paginationState(state: PaginationState | null) {
    this._paginationState = state;
  }

  // -----------------------------------------------------------------------
  // Action routing
  // -----------------------------------------------------------------------

  /** Register an action for a component ID. */
  registerAction(componentId: string, action: Action): void {
    this._actionMap.set(componentId, action);
  }

  /** Clear all registered actions (called before each render cycle). */
  clearActions(): void {
    this._actionMap.clear();
  }

  /** Look up the action for a given component ID. */
  resolveAction(componentId: string): Action | undefined {
    return this._actionMap.get(componentId);
  }

  /** Register actions from a list of button configs. */
  registerButtonActions(buttons: ButtonConfig[]): void {
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const id = btn.id ?? `__btn_${i}`;
      if (btn.action) {
        this.registerAction(id, btn.action);
      }
    }
  }
}
