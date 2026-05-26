import {
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
  useTheme,
} from "@/contexts/theme";
import { usePharmacyMapLocation } from "@/hooks/usePharmacyMapLocation";
import { fetchPharmaciesNear, type PharmacyPlace } from "@/service/pharmacyLocator";
import {
  fetchWalkingRouteToPharmacy,
  type PharmacyRoute,
} from "@/service/pharmacyDirections";
import { useDatabaseStore } from "@/stores/databaseStore";
import { isMedicationSupplyDepleted } from "@/utils/medicationSupply";
import {
  findClosestPharmacy,
  formatDistance,
  formatDuration,
} from "@/utils/geo";
import { openMapsDirections } from "@/utils/openMapsDirections";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, Polyline, type Region } from "react-native-maps";

const RADIUS_KM = 2;
const MAP_DELTA = 0.022;
const MAP_EDGE_PADDING = { top: 120, right: 48, bottom: 200, left: 48 };

function regionFor(latitude: number, longitude: number): Region {
  return {
    latitude,
    longitude,
    latitudeDelta: MAP_DELTA,
    longitudeDelta: MAP_DELTA,
  };
}

export default function FindPharmaciesScreen() {
  const params = useLocalSearchParams<{
    medicationId?: string | string[];
    medicationName?: string | string[];
  }>();
  const medicationId =
    typeof params.medicationId === "string"
      ? params.medicationId
      : params.medicationId?.[0] ?? null;
  const medicationName =
    typeof params.medicationName === "string"
      ? params.medicationName
      : params.medicationName?.[0] ?? "Medication";

  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { resolvedTheme } = useTheme();
  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const gradientColors = getGradientColors(resolvedTheme);

  const user = useDatabaseStore((s) => s.user);
  const medication = useMemo(
    () => user?.medications.find((m) => m.id === medicationId) ?? null,
    [user, medicationId]
  );

  const {
    coords,
    error: locationError,
    loading: locationLoading,
    batteryBlocked,
  } = usePharmacyMapLocation();

  const [pharmacies, setPharmacies] = useState<PharmacyPlace[]>([]);
  const [pharmacyError, setPharmacyError] = useState<string | null>(null);
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);
  const [route, setRoute] = useState<PharmacyRoute | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const lastFetchRef = useRef<string | null>(null);
  const lastRouteKeyRef = useRef<string | null>(null);

  const closest = useMemo(() => {
    if (!coords || pharmacies.length === 0) return null;
    return findClosestPharmacy(coords, pharmacies);
  }, [coords, pharmacies]);

  const loadPharmacies = useCallback(
    async (latitude: number, longitude: number, force = false) => {
      const key = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
      if (!force && lastFetchRef.current === key) return;
      lastFetchRef.current = key;
      setLoadingPharmacies(true);
      setPharmacyError(null);
      setRoute(null);
      lastRouteKeyRef.current = null;
      try {
        const results = await fetchPharmaciesNear(latitude, longitude);
        setPharmacies(results);
      } catch (e) {
        setPharmacyError(e instanceof Error ? e.message : "Could not load pharmacies");
        setPharmacies([]);
        lastFetchRef.current = null;
      } finally {
        setLoadingPharmacies(false);
      }
    },
    []
  );

  const fitMapToRoute = useCallback(
    (userCoords: { latitude: number; longitude: number }, path: PharmacyRoute) => {
      const points = path.coordinates.length > 0 ? path.coordinates : [userCoords];
      mapRef.current?.fitToCoordinates(points, {
        edgePadding: MAP_EDGE_PADDING,
        animated: true,
      });
    },
    []
  );

  useEffect(() => {
    if (!coords) return;
    void loadPharmacies(coords.latitude, coords.longitude);
  }, [coords, loadPharmacies]);

  useEffect(() => {
    if (!coords || !closest) {
      setRoute(null);
      return;
    }

    const routeKey = `${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}->${closest.id}`;
    if (lastRouteKeyRef.current === routeKey) return;
    lastRouteKeyRef.current = routeKey;

    let cancelled = false;
    setLoadingRoute(true);

    void (async () => {
      try {
        const path = await fetchWalkingRouteToPharmacy(coords, {
          latitude: closest.latitude,
          longitude: closest.longitude,
        });
        if (cancelled) return;
        setRoute(path);
        fitMapToRoute(coords, path);
      } catch {
        if (cancelled) return;
        const fallback = {
          coordinates: [
            coords,
            { latitude: closest.latitude, longitude: closest.longitude },
          ],
          distanceMeters: closest.distanceMeters,
          durationSeconds: Math.round(closest.distanceMeters / 1.4),
        };
        setRoute(fallback);
        fitMapToRoute(coords, fallback);
      } finally {
        if (!cancelled) setLoadingRoute(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [coords, closest, fitMapToRoute]);

  useEffect(() => {
    if (!medicationId || !user) return;
    if (!medication || !isMedicationSupplyDepleted(medication)) {
      router.back();
    }
  }, [medication, medicationId, router, user]);

  const mapRegion = coords ? regionFor(coords.latitude, coords.longitude) : null;
  const statusError = locationError ?? pharmacyError;
  const routeDistance = route?.distanceMeters ?? closest?.distanceMeters;
  const routeDuration = route?.durationSeconds;

  if (Platform.OS === "web") {
    return (
      <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
        <View style={styles.centered}>
          <Text style={[styles.title, { color: titleColor }]}>Nearby pharmacies</Text>
          <Text style={[styles.message, { color: secondaryColor }]}>
            The pharmacy map is available on iOS and Android. Open the app on your phone to
            find locations near you.
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go back</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        region={mapRegion ?? undefined}
        initialRegion={mapRegion ?? undefined}
        showsUserLocation={false}
        showsMyLocationButton={false}
        loadingEnabled
      >
        {coords ? (
          <Marker
            coordinate={coords}
            title="You"
            pinColor="#2563eb"
            accessibilityLabel="Your location"
          />
        ) : null}

        {pharmacies.map((pharmacy) => {
          const isClosest = closest?.id === pharmacy.id;
          return (
            <Marker
              key={pharmacy.id}
              coordinate={{
                latitude: pharmacy.latitude,
                longitude: pharmacy.longitude,
              }}
              title={pharmacy.name}
              description={isClosest ? "Closest pharmacy" : undefined}
              pinColor={isClosest ? "#16a34a" : "#dc2626"}
            />
          );
        })}

        {route && route.coordinates.length >= 2 ? (
          <Polyline
            coordinates={route.coordinates}
            strokeColor="#2563eb"
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}
      </MapView>

      <LinearGradient
        colors={["rgba(0,0,0,0.55)", "transparent"]}
        style={styles.topOverlay}
      >
        <Text style={styles.overlayTitle}>{medicationName}</Text>
        <Text style={styles.overlaySubtitle}>
          {batteryBlocked
            ? "Location off — battery below 30%"
            : closest
              ? `Nearest: ${closest.name}`
              : `Pharmacies within ${RADIUS_KM} km`}
        </Text>
        {(locationLoading || loadingPharmacies || loadingRoute) && (
          <ActivityIndicator color="#fff" style={styles.loader} />
        )}
        {statusError ? (
          <>
            <Text style={styles.overlayErrorLight}>{statusError}</Text>
            {coords ? (
              <Pressable
                style={styles.retryButton}
                onPress={() =>
                  void loadPharmacies(coords.latitude, coords.longitude, true)
                }
                accessibilityLabel="Retry loading pharmacies"
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}
        {!statusError && !locationLoading && pharmacies.length === 0 && !loadingPharmacies ? (
          <Text style={styles.overlaySubtitle}>No pharmacies found in this area.</Text>
        ) : null}
        {closest && routeDistance != null && !statusError ? (
          <Text style={styles.overlaySubtitle}>
            {formatDistance(routeDistance)}
            {routeDuration != null ? ` · ${formatDuration(routeDuration)}` : ""} · blue line =
            walking route
          </Text>
        ) : null}
      </LinearGradient>

      {closest && !statusError ? (
        <View style={styles.bottomCard}>
          <Text style={styles.bottomTitle}>Closest pharmacy</Text>
          <Text style={styles.bottomName}>{closest.name}</Text>
          {routeDistance != null ? (
            <Text style={styles.bottomMeta}>
              {formatDistance(routeDistance)}
              {routeDuration != null ? ` · about ${formatDuration(routeDuration)}` : ""}
            </Text>
          ) : null}
          <Pressable
            style={styles.directionsButton}
            onPress={() =>
              void openMapsDirections(
                closest.latitude,
                closest.longitude,
                closest.name
              )
            }
            accessibilityLabel={`Open turn-by-turn directions to ${closest.name}`}
          >
            <Text style={styles.directionsButtonText}>Open in Maps</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        style={styles.closeButton}
        onPress={() => router.back()}
        accessibilityLabel="Close pharmacy map"
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#333",
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  overlayTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  overlaySubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    marginTop: 4,
  },
  overlayErrorLight: {
    color: "#fecaca",
    fontSize: 14,
    marginTop: 8,
    fontWeight: "600",
  },
  loader: { marginTop: 10 },
  retryButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  bottomCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 96,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  bottomTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bottomName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 4,
  },
  bottomMeta: {
    fontSize: 14,
    color: "#475569",
    marginTop: 6,
  },
  directionsButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    alignItems: "center",
  },
  directionsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    position: "absolute",
    bottom: 32,
    alignSelf: "center",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
