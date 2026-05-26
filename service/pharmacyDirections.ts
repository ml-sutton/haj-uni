export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type PharmacyRoute = {
  coordinates: RouteCoordinate[];
  distanceMeters: number;
  durationSeconds: number;
};

type OsrmRouteResponse = {
  routes?: {
    distance: number;
    duration: number;
    geometry?: {
      coordinates: [number, number][];
    };
  }[];
  code?: string;
  message?: string;
};

type GoogleDirectionsResponse = {
  status: string;
  error_message?: string;
  routes?: {
    legs?: { distance: { value: number }; duration: { value: number } }[];
    overview_polyline?: { points: string };
  }[];
};

function getGoogleMapsApiKey(): string | null {
  return process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || null;
}

/** Decode Google's encoded polyline format. */
function decodePolyline(encoded: string): RouteCoordinate[] {
  const coordinates: RouteCoordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return coordinates;
}

function straightLineRoute(
  from: RouteCoordinate,
  to: RouteCoordinate
): PharmacyRoute {
  const distanceMeters = haversineMeters(from, to);
  return {
    coordinates: [from, to],
    distanceMeters,
    durationSeconds: Math.round(distanceMeters / 1.4),
  };
}

function haversineMeters(a: RouteCoordinate, b: RouteCoordinate): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

async function fetchOsrmRoute(
  from: RouteCoordinate,
  to: RouteCoordinate
): Promise<PharmacyRoute> {
  const url =
    `https://router.project-osrm.org/route/v1/foot/` +
    `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
    `?overview=full&geometries=geojson`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  const data = (await response.json()) as OsrmRouteResponse;

  if (data.code !== "Ok" || !data.routes?.[0]) {
    throw new Error(data.message ?? "Could not calculate walking route");
  }

  const route = data.routes[0];
  const line = route.geometry?.coordinates ?? [];
  if (line.length < 2) {
    return straightLineRoute(from, to);
  }

  return {
    coordinates: line.map(([lon, lat]) => ({ latitude: lat, longitude: lon })),
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  };
}

async function fetchGoogleDirectionsRoute(
  from: RouteCoordinate,
  to: RouteCoordinate
): Promise<PharmacyRoute> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) throw new Error("No Google API key");

  const url =
    `https://maps.googleapis.com/maps/api/directions/json` +
    `?origin=${from.latitude},${from.longitude}` +
    `&destination=${to.latitude},${to.longitude}` +
    `&mode=walking` +
    `&key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url);
  const data = (await response.json()) as GoogleDirectionsResponse;

  if (data.status !== "OK" || !data.routes?.[0]) {
    throw new Error(data.error_message ?? `Directions error: ${data.status}`);
  }

  const route = data.routes[0];
  const encoded = route.overview_polyline?.points;
  if (!encoded) throw new Error("No route geometry");

  const leg = route.legs?.[0];
  return {
    coordinates: decodePolyline(encoded),
    distanceMeters: leg?.distance.value ?? haversineMeters(from, to),
    durationSeconds: leg?.duration.value ?? 0,
  };
}

/** Walking route polyline from the user to a pharmacy. */
export async function fetchWalkingRouteToPharmacy(
  from: RouteCoordinate,
  to: RouteCoordinate
): Promise<PharmacyRoute> {
  const googleKey = getGoogleMapsApiKey();
  if (googleKey) {
    try {
      return await fetchGoogleDirectionsRoute(from, to);
    } catch {
      // fall through
    }
  }

  try {
    return await fetchOsrmRoute(from, to);
  } catch {
    return straightLineRoute(from, to);
  }
}
