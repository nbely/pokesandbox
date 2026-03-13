/**
 * Session-wide key-value state store.
 * Shared across all menus within a single session.
 * Replaces v1's `session.setState(key, value)` untyped pattern.
 */
export class StateStore {
  private readonly _data = new Map<string, unknown>();

  /** Get a value by key. Returns undefined if not set. */
  get<T = unknown>(key: string): T | undefined {
    return this._data.get(key) as T | undefined;
  }

  /** Set a value by key. */
  set<T = unknown>(key: string, value: T): void {
    this._data.set(key, value);
  }

  /** Check if a key exists. */
  has(key: string): boolean {
    return this._data.has(key);
  }

  /** Delete a key. Returns true if the key existed. */
  delete(key: string): boolean {
    return this._data.delete(key);
  }

  /** Clear all stored state. */
  clear(): void {
    this._data.clear();
  }

  /** Get all keys. */
  keys(): IterableIterator<string> {
    return this._data.keys();
  }

  /** Get the number of entries. */
  get size(): number {
    return this._data.size;
  }
}
