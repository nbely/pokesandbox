/**
 * MenuInstance — Runtime wrapper around a MenuDefinition.
 *
 * Created by the MenuSession for each active menu. Holds the definition,
 * context, state, and delegates rendering/action handling.
 */
import type {
  MenuContext,
  MenuInstanceLike,
  ResponseType,
} from '../context/MenuContext';
import type { MenuDefinition } from '../registry/MenuRegistry';
import type {
  Action,
  ButtonConfig,
  ModalConfig,
  PaginationState,
  SelectConfig,
} from '../types/common';
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

  /** Active select menu config (set during render) */
  private _activeSelect: SelectConfig | null = null;

  /** Active modal config (set during render or via openModal action) */
  private _activeModal: ModalConfig | null = null;

  /** Whether a modal is currently displayed */
  private _isModalActive = false;

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

  get activeModal(): ModalConfig | null {
    return this._activeModal;
  }

  get isModalActive(): boolean {
    return this._isModalActive;
  }

  set isModalActive(value: boolean) {
    this._isModalActive = value;
  }

  get activeSelect(): SelectConfig | null {
    return this._activeSelect;
  }

  // -----------------------------------------------------------------------
  // Response type determination
  // -----------------------------------------------------------------------

  /**
   * Determine the response type for interaction collection.
   * A menu can accept components, messages, or both.
   */
  getResponseType(): ResponseType {
    const hasComponents =
      !!this.definition.setButtons ||
      !!this.definition.setSelectMenu ||
      !!this.definition.setLayout ||
      this.definition.isCancellable ||
      this.definition.isReturnable;
    const hasMessage = !!this.definition.handleMessage;

    if (hasComponents && hasMessage) return 'mixed';
    if (hasMessage) return 'message';
    return 'component';
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
    this._activeSelect = null;
    this._activeModal = null;
    this._isModalActive = false;
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

  /** Register a select menu config and its onSelect action. */
  registerSelectAction(selectConfig: SelectConfig): void {
    this._activeSelect = selectConfig;
    const id = selectConfig.id ?? '__select';
    if (selectConfig.onSelect) {
      this.registerAction(id, selectConfig.onSelect);
    }
  }

  /** Register a modal config and its onSubmit action. */
  registerModalConfig(modalConfig: ModalConfig): void {
    this._activeModal = modalConfig;
  }

  /**
   * Called by the openModal action to mark a modal as ready to show.
   * The session checks this flag before the render/interaction cycle.
   */
  async openModal(): Promise<void> {
    this._isModalActive = true;
  }

  /** Register actions from layout component tree (recursive). */
  registerLayoutActions(
    components: readonly (
      | ButtonConfig
      | SelectConfig
      | { type: string; children?: unknown[] }
    )[]
  ): void {
    for (const component of components) {
      if (component.type === 'button') {
        const btn = component as ButtonConfig;
        const id = btn.id ?? `__btn_${this._actionMap.size}`;
        if (btn.action) {
          this.registerAction(id, btn.action);
        }
      } else if (component.type === 'select') {
        this.registerSelectAction(component as SelectConfig);
      } else if (component.type === 'action_row') {
        const row = component as {
          type: string;
          children: (ButtonConfig | SelectConfig)[];
        };
        this.registerLayoutActions(row.children);
      } else if (component.type === 'container') {
        const container = component as { type: string; children: unknown[] };
        this.registerLayoutActions(
          container.children as (
            | ButtonConfig
            | SelectConfig
            | { type: string; children?: unknown[] }
          )[]
        );
      } else if (component.type === 'section') {
        const section = component as { type: string; accessory?: ButtonConfig };
        if (section.accessory?.type === 'button' && section.accessory.action) {
          const id = section.accessory.id ?? `__btn_${this._actionMap.size}`;
          this.registerAction(id, section.accessory.action);
        }
      } else if (component.type === 'paginated_group') {
        const group = component as { type: string; buttons: ButtonConfig[] };
        this.registerButtonActions(group.buttons);
      }
    }
  }
}
