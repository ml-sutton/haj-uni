import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";

export type MapCoordinates = {
  latitude: number;
  longitude: number;
};

type UsePharmacyMapLocationResult = {
  coords: MapCoordinates | null;
  error: string | null;
  loading: boolean;
};

/**
 * Foreground location updates only while the caller is mounted.
 * Subscription is removed on unmount — do not use outside the pharmacy map screen.
 */
export function usePharmacyMapLocation(): UsePharmacyMapLocationResult {
  const [coords, setCoords] = useState<MapCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      if (status !== Location.PermissionStatus.GRANTED) {
        setError("Location permission is required to show nearby pharmacies.");
        setLoading(false);
        return;
      }

      try {
        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setCoords({
            latitude: initial.coords.latitude,
            longitude: initial.coords.longitude,
          });
          setLoading(false);
        }

        subscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 40,
          },
          (update) => {
            if (cancelled) return;
            setCoords({
              latitude: update.coords.latitude,
              longitude: update.coords.longitude,
            });
          }
        );
      } catch {
        if (!cancelled) {
          setError("Could not determine your location.");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, []);

  return { coords, error, loading };
}
