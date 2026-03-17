/**
 * Navigation history stack for menu sessions.
 * Tracks the chain of menus visited so that goBack() can restore
 * the previous menu and its options.
 */

export interface MenuStackEntry {
  /** Registered menu identifier */
  menuId: string;
  /** Options the menu was opened with */
  options?: Record<string, unknown>;
}

export class MenuStack {
  private readonly _entries: MenuStackEntry[] = [];

  /** Push a menu onto the navigation stack. */
  push(entry: MenuStackEntry): void {
    this._entries.push(entry);
  }

  /** Pop the top entry. Returns undefined if empty. */
  pop(): MenuStackEntry | undefined {
    return this._entries.pop();
  }

  /** Peek at the top entry without removing it. */
  peek(): MenuStackEntry | undefined {
    return this._entries[this._entries.length - 1];
  }

  /** Number of entries on the stack. */
  get size(): number {
    return this._entries.length;
  }

  /** Whether the stack is empty. */
  get isEmpty(): boolean {
    return this._entries.length === 0;
  }

  /** Clear the entire stack. */
  clear(): void {
    this._entries.length = 0;
  }

  /** Get a read-only copy of all entries (oldest first). */
  get entries(): ReadonlyArray<MenuStackEntry> {
    return this._entries;
  }
}
