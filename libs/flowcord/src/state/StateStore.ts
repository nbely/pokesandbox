/**
 * Session-wide key-value state store.
 * Shared across all menus within a single session.
 *
 * When parameterized with a type (e.g., StateStore<{ gold: number }>),
 * get/set become type-safe with known keys.
 * Falls back to untyped access when using the default generic.
 */
export class StateStore<
  T extends Record<string, unknown> = Record<string, unknown>
> {
  private readonly _data = new Map<string, unknown>();

  /** Get a value by key. Typed when T is provided. */
  get<K extends string & keyof T>(key: K): T[K] | undefined;
  get<V = unknown>(key: string): V | undefined;
  get(key: string): unknown {
    return this._data.get(key);
  }

  /** Set a value by key. Typed when T is provided. */
  set<K extends string & keyof T>(key: K, value: T[K]): void;
  set<V = unknown>(key: string, value: V): void;
  set(key: string, value: unknown): void {
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
