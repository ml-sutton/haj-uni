import * as Battery from "expo-battery";

/** Minimum battery fraction (0–1) required for pharmacy map location. */
export const MIN_BATTERY_FRACTION_FOR_LOCATION = 0.3;

export function formatBatteryPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/**
 * True when battery is known and below the location threshold.
 * Returns false when level cannot be read (e.g. some simulators).
 */
export async function isBatteryTooLowForLocation(): Promise<boolean> {
  if (!(await Battery.isAvailableAsync())) return false;
  const level = await Battery.getBatteryLevelAsync();
  if (level < 0) return false;
  return level < MIN_BATTERY_FRACTION_FOR_LOCATION;
}

export async function getBatteryLevelOrNull(): Promise<number | null> {
  if (!(await Battery.isAvailableAsync())) return null;
  const level = await Battery.getBatteryLevelAsync();
  return level >= 0 ? level : null;
}

export const BATTERY_TOO_LOW_LOCATION_MESSAGE =
  "Location is unavailable when battery is below 30%. Charge your device and try again.";
