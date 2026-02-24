import assert from 'node:assert';

export function assertOptions<T extends Record<string, unknown>>(
  options?: T
): asserts options is T {
  assert(options, 'Options are required to display this menu.');
}
