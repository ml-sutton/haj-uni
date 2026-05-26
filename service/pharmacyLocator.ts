export type PharmacyPlace = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

type OverpassElement = {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: { name?: string };
};

type OverpassResponse = {
  elements?: OverpassElement[];
  remark?: string;
};

type GooglePlacesResponse = {
  status: string;
  error_message?: string;
  results?: {
    place_id: string;
    name: string;
    geometry: { location: { lat: number; lng: number } };
  }[];
};

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
] as const;

const RADIUS_METERS = 2000;
const USER_AGENT = "HAJ-Uni/1.0 (medication refill map; contact: local-only)";

function elementCoords(el: OverpassElement): { lat: number; lon: number } | null {
  if (el.lat != null && el.lon != null) return { lat: el.lat, lon: el.lon };
  if (el.center) return { lat: el.center.lat, lon: el.center.lon };
  return null;
}

function buildOverpassQuery(latitude: number, longitude: number, radiusMeters: number): string {
  return `
[out:json][timeout:25];
(
  node["amenity"="pharmacy"](around:${radiusMeters},${latitude},${longitude});
  node["healthcare"="pharmacy"](around:${radiusMeters},${latitude},${longitude});
  node["shop"="chemist"](around:${radiusMeters},${latitude},${longitude});
  way["amenity"="pharmacy"](around:${radiusMeters},${latitude},${longitude});
);
out center;
`.trim();
}

function parseOverpassElements(data: OverpassResponse): PharmacyPlace[] {
  if (data.remark) {
    throw new Error(data.remark);
  }
  const places: PharmacyPlace[] = [];
  const seen = new Set<string>();

  for (const el of data.elements ?? []) {
    const coords = elementCoords(el);
    if (!coords) continue;
    const dedupeKey = `${coords.lat.toFixed(5)},${coords.lon.toFixed(5)}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    places.push({
      id: `${el.type}/${el.id}`,
      name: el.tags?.name?.trim() || "Pharmacy",
      latitude: coords.lat,
      longitude: coords.lon,
    });
  }

  places.sort((a, b) => a.name.localeCompare(b.name));
  return places;
}

async function fetchOverpassFromEndpoint(
  endpoint: string,
  query: string
): Promise<PharmacyPlace[]> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      text.includes("<!DOCTYPE")
        ? `Pharmacy lookup failed (${response.status}). Try again in a moment.`
        : text.slice(0, 120) || `Pharmacy lookup failed (${response.status})`
    );
  }

  let data: OverpassResponse;
  try {
    data = JSON.parse(text) as OverpassResponse;
  } catch {
    throw new Error("Invalid response from pharmacy data service");
  }

  return parseOverpassElements(data);
}

async function fetchOverpassPharmacies(
  latitude: number,
  longitude: number,
  radiusMeters: number
): Promise<PharmacyPlace[]> {
  const query = buildOverpassQuery(latitude, longitude, radiusMeters);
  let lastError: Error | null = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      return await fetchOverpassFromEndpoint(endpoint, query);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error("Overpass request failed");
    }
  }

  throw lastError ?? new Error("Could not load nearby pharmacies");
}

function getGoogleMapsApiKey(): string | null {
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  return key || null;
}

async function fetchGooglePharmacies(
  latitude: number,
  longitude: number,
  radiusMeters: number
): Promise<PharmacyPlace[]> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error("Google Maps API key not configured");
  }

  const url =
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
    `?location=${latitude},${longitude}` +
    `&radius=${radiusMeters}` +
    `&type=pharmacy` +
    `&key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url);
  const data = (await response.json()) as GooglePlacesResponse;

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(data.error_message ?? `Google Places error: ${data.status}`);
  }

  return (data.results ?? []).map((place) => ({
    id: place.place_id,
    name: place.name,
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
  }));
}

/** Pharmacies within `radiusMeters` of a point (default 2 km). */
export async function fetchPharmaciesNear(
  latitude: number,
  longitude: number,
  radiusMeters: number = RADIUS_METERS
): Promise<PharmacyPlace[]> {
  const googleKey = getGoogleMapsApiKey();
  if (googleKey) {
    try {
      const googleResults = await fetchGooglePharmacies(latitude, longitude, radiusMeters);
      if (googleResults.length > 0) return googleResults;
    } catch {
      // Fall through to OpenStreetMap
    }
  }

  return fetchOverpassPharmacies(latitude, longitude, radiusMeters);
}
