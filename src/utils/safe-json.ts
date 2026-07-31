/**
 * A JSON reviver that blocks prototype pollution by forbidding
 * the keys '__proto__', 'constructor', and 'prototype'.
 */
export function safeJsonReviver(key: string, value: unknown): unknown {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
    return undefined; // Drop the polluted key
  }
  return value;
}

/**
 * Safely parses a JSON string, preventing prototype pollution.
 * @param text The JSON string to parse
 * @returns The parsed object
 */
export function safeJsonParse<T = unknown>(text: string): T {
  return JSON.parse(text, safeJsonReviver) as T;
}
