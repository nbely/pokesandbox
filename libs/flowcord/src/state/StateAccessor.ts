/**
 * Typed, menu-local state accessor.
 * Each menu gets its own StateAccessor<TState> that provides
 * typed get/set/merge operations scoped to that menu.
 *
 * Unlike the session-wide StateStore, this is strongly typed via
 * the builder's generic parameter.
 */
export class StateAccessor<
  TState extends Record<string, unknown> = Record<string, unknown>
> {
  private _data: TState;

  constructor(initialState: TState) {
    this._data = { ...initialState };
  }

  /** Get the full state object. */
  get current(): Readonly<TState> {
    return this._data;
  }

  /** Get a single property. */
  get<K extends keyof TState>(key: K): TState[K] {
    return this._data[key];
  }

  /** Set a single property. */
  set<K extends keyof TState>(key: K, value: TState[K]): void {
    this._data[key] = value;
  }

  /** Merge a partial state object into the current state. */
  merge(partial: Partial<TState>): void {
    this._data = { ...this._data, ...partial };
  }

  /** Reset state to a new value. */
  reset(newState: TState): void {
    this._data = { ...newState };
  }
}
