import type { PharmacyPlace } from "@/service/pharmacyLocator";

/** Mean Earth radius in metres for haversine distance calculations. */
const EARTH_RADIUS_M = 6_371_000;

/**
 * Great-circle distance in metres between two WGS84 coordinates (haversine formula).
 *
 * @param a - First point with `latitude` and `longitude` in degrees.
 * @param b - Second point with `latitude` and `longitude` in degrees.
 * @returns Distance in metres along the Earth's surface.
 */
export function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Formats a distance in metres for display (metres or kilometres).
 *
 * @param meters - Distance from {@link distanceMeters} or similar.
 * @returns `"250 m"` under 1 km, otherwise `"1.2 km"` with one decimal.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Formats a walking duration in seconds as a short human-readable label.
 *
 * @param seconds - Route or estimate duration in seconds.
 * @returns Such as `"12 min walk"` or `"1 hr 5 min walk"`.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min walk`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} hr ${m} min walk` : `${h} hr walk`;
}

/**
 * Finds the pharmacy closest to an origin by straight-line distance.
 *
 * @param origin - User or map centre coordinates.
 * @param pharmacies - Candidate places from the locator service.
 * @returns Closest {@link PharmacyPlace} with `distanceMeters` attached, or `null` if the list is empty.
 */
export function findClosestPharmacy(
  origin: { latitude: number; longitude: number },
  pharmacies: PharmacyPlace[]
): (PharmacyPlace & { distanceMeters: number }) | null {
  if (pharmacies.length === 0) return null;
  let closest = pharmacies[0];
  let minDist = distanceMeters(origin, closest);
  for (let i = 1; i < pharmacies.length; i++) {
    const d = distanceMeters(origin, pharmacies[i]);
    if (d < minDist) {
      minDist = d;
      closest = pharmacies[i];
    }
  }
  return { ...closest, distanceMeters: minDist };
}
