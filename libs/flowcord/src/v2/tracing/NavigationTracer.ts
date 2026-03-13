/**
 * Runtime navigation event recording.
 *
 * The engine emits NavigationEvents on every menu transition.
 * A future dev tool can consume these to build flow diagrams.
 *
 * Minimal implementation — designed-for but not fully fleshed out yet.
 */

export interface NavigationEvent {
  from: string;
  to: string;
  sessionId: string;
  userId: string;
  timestamp: number;
  /** Which component triggered the navigation (e.g., 'button:add-prefix') */
  trigger?: string;
}

export class NavigationTracer {
  private readonly _events: NavigationEvent[] = [];
  private _enabled = false;

  /** Enable event recording. */
  enable(): void {
    this._enabled = true;
  }

  /** Disable event recording. */
  disable(): void {
    this._enabled = false;
  }

  /** Record a navigation event. No-op if disabled. */
  record(event: NavigationEvent): void {
    if (!this._enabled) return;
    this._events.push(event);
  }

  /** Get all recorded events. */
  get events(): ReadonlyArray<NavigationEvent> {
    return this._events;
  }

  /** Clear recorded events. */
  clear(): void {
    this._events.length = 0;
  }

  /** Get all paths originating from a given menu. */
  getPathsFrom(menuId: string): string[][] {
    const paths: string[][] = [];
    const visited = new Set<string>();

    const dfs = (current: string, path: string[]): void => {
      if (visited.has(current)) return;
      visited.add(current);

      const next = this._events
        .filter((e) => e.from === current)
        .map((e) => e.to);

      if (next.length === 0) {
        paths.push([...path]);
        visited.delete(current);
        return;
      }

      for (const n of new Set(next)) {
        dfs(n, [...path, n]);
      }
      visited.delete(current);
    };

    dfs(menuId, [menuId]);
    return paths;
  }
}
