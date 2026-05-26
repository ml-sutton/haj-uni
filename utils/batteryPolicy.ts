import * as Battery from "expo-battery";

/**
 * Minimum battery fraction (0–1) required before the pharmacy map may use device location.
 *
 * @remarks
 * Reduces location use on critically low battery; see {@link isBatteryTooLowForLocation}.
 */
export const MIN_BATTERY_FRACTION_FOR_LOCATION = 0.3;

/**
 * Formats a battery level fraction as a whole-number percentage string.
 *
 * @param fraction - Level from 0 to 1 (as returned by Expo Battery APIs).
 * @returns Human-readable string such as `"42%"`.
 */
export function formatBatteryPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/**
 * Whether battery is known and below {@link MIN_BATTERY_FRACTION_FOR_LOCATION}.
 *
 * @returns `true` when location features should be blocked; `false` when level is unknown or sufficient.
 *
 * @remarks
 * Returns `false` when the battery API is unavailable (some simulators) or reports an invalid level (`< 0`).
 */
export async function isBatteryTooLowForLocation(): Promise<boolean> {
  if (!(await Battery.isAvailableAsync())) return false;
  const level = await Battery.getBatteryLevelAsync();
  if (level < 0) return false;
  return level < MIN_BATTERY_FRACTION_FOR_LOCATION;
}

/**
 * Reads the current battery level when the platform exposes it.
 *
 * @returns Fraction 0–1, or `null` when battery state cannot be read.
 */
export async function getBatteryLevelOrNull(): Promise<number | null> {
  if (!(await Battery.isAvailableAsync())) return null;
  const level = await Battery.getBatteryLevelAsync();
  return level >= 0 ? level : null;
}

/**
 * User-visible message when map location is blocked due to low battery.
 */
export const BATTERY_TOO_LOW_LOCATION_MESSAGE =
  "Location is unavailable when battery is below 30%. Charge your device and try again.";
