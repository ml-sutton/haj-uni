/**
 * Generates a short unique id suitable for doses, dosages, notes, and medications.
 *
 * @returns A string combining a base-36 timestamp and random suffix (e.g. `"m3k2ab-x7f2p9q"`).
 *
 * @remarks
 * Not cryptographically secure; intended for client-side entity keys only.
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
