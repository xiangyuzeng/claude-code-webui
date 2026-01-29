/**
 * ID generation utilities
 */

/**
 * Generate a unique ID using timestamp and random string
 * @returns Unique identifier string
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
