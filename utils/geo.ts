import type { PharmacyPlace } from "@/service/pharmacyLocator";

const EARTH_RADIUS_M = 6_371_000;

/** Great-circle distance in metres between two WGS84 points. */
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

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min walk`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} hr ${m} min walk` : `${h} hr walk`;
}

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
