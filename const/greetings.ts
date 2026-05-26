/**
 * Greeting strings indexed by time-of-day bucket: morning, afternoon, evening, and a generic fallback.
 *
 * @remarks
 * Used by {@link getGreeting} based on the device's local hour (0–23).
 */
export const GREETINGS = [
  "Good morning",
  "Good afternoon",
  "Good evening",
  "Hello",
] as const;

/**
 * Returns a time-appropriate greeting for the current local clock.
 *
 * @returns One of {@link GREETINGS}: before 12:00 morning, before 17:00 afternoon, before 21:00 evening, otherwise `"Hello"`.
 *
 * @example
 * ```ts
 * const text = `${getGreeting()}, Alex`;
 * ```
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return GREETINGS[0];
  if (hour < 17) return GREETINGS[1];
  if (hour < 21) return GREETINGS[2];
  return GREETINGS[3];
}
