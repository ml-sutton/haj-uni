import {
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
  useTheme,
} from "@/contexts/theme";
import { usePharmacyMapLocation } from "@/hooks/usePharmacyMapLocation";
import { fetchPharmaciesNear, type PharmacyPlace } from "@/service/pharmacyLocator";
import { useDatabaseStore } from "@/stores/databaseStore";
import { isMedicationSupplyDepleted } from "@/utils/medicationSupply";
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
import MapView, { Marker, type Region } from "react-native-maps";

const RADIUS_KM = 2;
const MAP_DELTA = 0.022;

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
  const { resolvedTheme } = useTheme();
  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const gradientColors = getGradientColors(resolvedTheme);

  const user = useDatabaseStore((s) => s.user);
  const medication = useMemo(
    () => user?.medications.find((m) => m.id === medicationId) ?? null,
    [user, medicationId]
  );

  const { coords, error: locationError, loading: locationLoading } =
    usePharmacyMapLocation();

  const [pharmacies, setPharmacies] = useState<PharmacyPlace[]>([]);
  const [pharmacyError, setPharmacyError] = useState<string | null>(null);
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);
  const lastFetchRef = useRef<string | null>(null);

  const loadPharmacies = useCallback(
    async (latitude: number, longitude: number, force = false) => {
      const key = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
      if (!force && lastFetchRef.current === key) return;
      lastFetchRef.current = key;
      setLoadingPharmacies(true);
      setPharmacyError(null);
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

  useEffect(() => {
    if (!coords) return;
    void loadPharmacies(coords.latitude, coords.longitude);
  }, [coords, loadPharmacies]);

  useEffect(() => {
    if (!medicationId || !user) return;
    if (!medication || !isMedicationSupplyDepleted(medication)) {
      router.back();
    }
  }, [medication, medicationId, router, user]);

  const mapRegion = coords ? regionFor(coords.latitude, coords.longitude) : null;

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

  const statusError = locationError ?? pharmacyError;

  return (
    <View style={styles.container}>
      <MapView
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
        {pharmacies.map((pharmacy) => (
          <Marker
            key={pharmacy.id}
            coordinate={{
              latitude: pharmacy.latitude,
              longitude: pharmacy.longitude,
            }}
            title={pharmacy.name}
            pinColor="#dc2626"
          />
        ))}
      </MapView>

      <LinearGradient
        colors={["rgba(0,0,0,0.55)", "transparent"]}
        style={styles.topOverlay}
      >
        <Text style={styles.overlayTitle}>{medicationName}</Text>
        <Text style={styles.overlaySubtitle}>
          Pharmacies within {RADIUS_KM} km · location active on this screen only
        </Text>
        {(locationLoading || loadingPharmacies) && (
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
        {!statusError && pharmacies.length > 0 ? (
          <Text style={styles.overlaySubtitle}>{pharmacies.length} pharmacy pins on map</Text>
        ) : null}
      </LinearGradient>

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
