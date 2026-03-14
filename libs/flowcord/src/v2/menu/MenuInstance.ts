/**
 * MenuInstance — Runtime wrapper around a MenuDefinition.
 *
 * Created by the MenuSession for each active menu. Holds the definition,
 * context, state, and delegates rendering/action handling.
 */
import { ButtonStyle } from 'discord.js';
import type { MenuInstanceLike, ResponseType } from '../context/MenuContext';
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

  /** Component IDs that trigger a modal, mapped to their target modal ID */
  private readonly _modalButtonMap = new Map<string, string>();

  /** Current pagination state */
  private _paginationState: PaginationState | null = null;

  /** Active select menu config (set during render) */
  private _activeSelect: SelectConfig | null = null;

  /** Registered modals keyed by ID ('__default' for unnamed) */
  private readonly _modalMap = new Map<string, ModalConfig>();

  /** The currently-triggered modal (set when a modal button is clicked) */
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
    this._modalButtonMap.clear();
    this._modalMap.clear();
    this._activeSelect = null;
    this._activeModal = null;
    this._isModalActive = false;
  }

  /** Look up the action for a given component ID. */
  resolveAction(componentId: string): Action | undefined {
    return this._actionMap.get(componentId);
  }

  /** Register actions from a list of button configs. Mutates btn.id for stable serialization. */
  registerButtonActions(buttons: ButtonConfig[]): void {
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const id = btn.id ?? `__btn_${i}`;
      btn.id = id; // Assign stable ID so serialization matches registration

      // Link buttons are handled natively by Discord — skip registration entirely.
      if (this.isLinkButton(btn)) {
        this.validateButton(btn);
        continue;
      }

      this.validateButton(btn);

      if (btn.opensModal) {
        const modalId =
          typeof btn.opensModal === 'string' ? btn.opensModal : '__default';
        this._modalButtonMap.set(id, modalId);
        // Register a placeholder action so the routing picks it up;
        // the session handles the actual showModal() call.
        this.registerAction(id, async () => {
          /* modal trigger */
        });
      } else if (btn.action) {
        this.registerAction(id, btn.action);
      }
    }
  }

  /** Register a select menu config. Action dispatched separately via activeSelect. */
  registerSelectAction(selectConfig: SelectConfig): void {
    this._activeSelect = selectConfig;
  }

  /**
   * Register one or more modal configs.
   * Each config's `id` is used as the key; unnamed modals use '__default'.
   */
  registerModalConfigs(configs: ModalConfig | ModalConfig[]): void {
    const arr = Array.isArray(configs) ? configs : [configs];
    for (const config of arr) {
      const key = config.id ?? '__default';
      this._modalMap.set(key, config);
    }
  }

  /** Look up a registered modal by ID. */
  getModal(modalId: string): ModalConfig | undefined {
    return this._modalMap.get(modalId);
  }

  /**
   * Called by the openModal action to mark a modal as ready to show.
   * The session checks this flag before the render/interaction cycle.
   */
  async openModal(modalId?: string): Promise<void> {
    const key = modalId ?? '__default';
    const modal = this._modalMap.get(key);
    if (modal) {
      this._activeModal = modal;
      this._isModalActive = true;
    }
  }

  /** Check if a component ID is registered as a modal trigger. */
  isModalButton(componentId: string): boolean {
    return this._modalButtonMap.has(componentId);
  }

  /** Get the modal ID a button is configured to open. */
  getModalIdForButton(componentId: string): string | undefined {
    return this._modalButtonMap.get(componentId);
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
        btn.id = id; // Assign stable ID so serialization matches registration

        if (this.isLinkButton(btn)) {
          this.validateButton(btn);
          continue;
        }

        this.validateButton(btn);

        if (btn.opensModal) {
          const modalId =
            typeof btn.opensModal === 'string' ? btn.opensModal : '__default';
          this._modalButtonMap.set(id, modalId);
          this.registerAction(id, async () => {
            /* modal trigger */
          });
        } else if (btn.action) {
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
        if (section.accessory?.type === 'button') {
          const acc = section.accessory;
          const id = acc.id ?? `__btn_${this._actionMap.size}`;
          acc.id = id;

          if (this.isLinkButton(acc)) {
            this.validateButton(acc);
            continue;
          }

          this.validateButton(acc);

          if (acc.opensModal) {
            const modalId =
              typeof acc.opensModal === 'string' ? acc.opensModal : '__default';
            this._modalButtonMap.set(id, modalId);
            this.registerAction(id, async () => {
              /* modal trigger */
            });
          } else if (acc.action) {
            this.registerAction(id, acc.action);
          }
        }
      } else if (component.type === 'paginated_group') {
        const group = component as { type: string; buttons: ButtonConfig[] };
        this.registerButtonActions(group.buttons);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Button validation
  // -----------------------------------------------------------------------

  /** Check if a button config represents a Discord link button. */
  private isLinkButton(btn: ButtonConfig): boolean {
    return btn.style === ButtonStyle.Link;
  }

  /**
   * Validate a ButtonConfig and log warnings for misconfigured combinations.
   * Called during action registration for every button.
   */
  private validateButton(btn: ButtonConfig): void {
    const label = btn.label ?? btn.id ?? 'unknown';
    const menuName = this.definition.name;

    if (this.isLinkButton(btn)) {
      // Link buttons: must have url, action/opensModal are ignored
      if (!btn.url) {
        console.warn(
          `[FlowCord] Menu "${menuName}": Link button "${label}" is missing a \`url\`. ` +
            `Link buttons require a URL.`
        );
      }
      if (btn.action) {
        console.warn(
          `[FlowCord] Menu "${menuName}": Link button "${label}" has an \`action\` which will be ignored. ` +
            `Link buttons are handled by Discord and don't generate interactions.`
        );
      }
      if (btn.opensModal) {
        console.warn(
          `[FlowCord] Menu "${menuName}": Link button "${label}" has \`opensModal\` which will be ignored. ` +
            `Link buttons are handled by Discord and don't generate interactions.`
        );
      }
      return;
    }

    // Non-link buttons: check for action/opensModal conflicts
    if (btn.action && btn.opensModal) {
      console.warn(
        `[FlowCord] Menu "${menuName}": Button "${label}" has both \`action\` and \`opensModal\`. ` +
          `\`opensModal\` takes precedence — the action will be ignored.`
      );
    }

    // Non-link, non-disabled buttons should have at least action or opensModal
    if (!btn.disabled && !btn.action && !btn.opensModal) {
      console.warn(
        `[FlowCord] Menu "${menuName}": Button "${label}" has no \`action\`, \`opensModal\`, or \`url\`. ` +
          `It will render but do nothing when clicked. If intentional, set \`disabled: true\`.`
      );
    }
  }
}
