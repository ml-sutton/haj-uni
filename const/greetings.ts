/** Greetings by time of day: morning, afternoon, evening. */
export const GREETINGS = [
  "Good morning",
  "Good afternoon",
  "Good evening",
  "Hello",
] as const;

/** Returns a greeting based on current hour (0–23). */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return GREETINGS[0];
  if (hour < 17) return GREETINGS[1];
  if (hour < 21) return GREETINGS[2];
  return GREETINGS[3];
}