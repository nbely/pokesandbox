/**
 * Automatic component ID namespacing.
 *
 * All component customIds are prefixed with `sessionId:menuId:` before sending
 * to Discord, and the prefix is stripped when routing incoming interactions.
 * This prevents cross-session collisions when multiple users interact simultaneously.
 */

export interface ParsedComponentId {
  sessionId: string;
  menuId: string;
  componentId: string;
}

export class ComponentIdManager {
  constructor(
    private readonly sessionId: string,
    private readonly menuId: string
  ) {}

  /**
   * Prefix a developer-provided id with session and menu scope.
   * @example namespace('remove-prefix-0') → 'sess_abc123:manage-prefixes:remove-prefix-0'
   */
  namespace(componentId: string): string {
    return `${this.sessionId}:${this.menuId}:${componentId}`;
  }

  /**
   * Extract the original id from a namespaced customId.
   * Returns null if the id doesn't match the expected format.
   */
  static parse(namespacedId: string): ParsedComponentId | null {
    const firstColon = namespacedId.indexOf(':');
    if (firstColon === -1) return null;

    const secondColon = namespacedId.indexOf(':', firstColon + 1);
    if (secondColon === -1) return null;

    return {
      sessionId: namespacedId.slice(0, firstColon),
      menuId: namespacedId.slice(firstColon + 1, secondColon),
      componentId: namespacedId.slice(secondColon + 1),
    };
  }

  /**
   * Deep-walk a Discord API component JSON tree and rewrite every `custom_id`
   * field with the session:menu namespace prefix.
   *
   * This is used for external builders (ModalBuilder, SelectMenuBuilder) where
   * the developer has already called `.setCustomId()`. The framework intercepts
   * the `.toJSON()` output and rewrites IDs before sending.
   */
  rewriteComponentIds<T>(json: T): T {
    if (json === null || json === undefined) return json;
    if (typeof json !== 'object') return json;

    if (Array.isArray(json)) {
      return json.map((item) => this.rewriteComponentIds(item)) as T;
    }

    const obj = json as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (key === 'custom_id' && typeof value === 'string') {
        // Only namespace if not already namespaced (avoid double-prefixing)
        const parsed = ComponentIdManager.parse(value);
        if (parsed) {
          result[key] = value; // Already namespaced
        } else {
          result[key] = this.namespace(value);
        }
      } else {
        result[key] = this.rewriteComponentIds(value);
      }
    }

    return result as T;
  }
}
