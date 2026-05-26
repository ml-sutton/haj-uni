import {
  BATTERY_TOO_LOW_LOCATION_MESSAGE,
  isBatteryTooLowForLocation,
  MIN_BATTERY_FRACTION_FOR_LOCATION,
} from "@/utils/batteryPolicy";
import * as Battery from "expo-battery";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";

/**
 * WGS84 coordinates for pharmacy map and routing.
 */
export type MapCoordinates = {
  latitude: number;
  longitude: number;
};

type UsePharmacyMapLocationResult = {
  coords: MapCoordinates | null;
  error: string | null;
  loading: boolean;
  batteryBlocked: boolean;
};

/**
 * Provides foreground location updates for the pharmacy map while mounted.
 *
 * @returns `coords` (latest fix or null), `error` message, `loading` until first fix or failure, and `batteryBlocked` when tracking stopped due to low battery.
 * @remarks Requests foreground permission only. Stops watching when battery drops below {@link MIN_BATTERY_FRACTION_FOR_LOCATION} (30%). Subscription is removed on unmount.
 * @example
 * ```tsx
 * const { coords, error, loading, batteryBlocked } = usePharmacyMapLocation();
 * ```
 */
export function usePharmacyMapLocation(): UsePharmacyMapLocationResult {
  const [coords, setCoords] = useState<MapCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [batteryBlocked, setBatteryBlocked] = useState(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const batteryListenerRef = useRef<Battery.Subscription | null>(null);

  const stopLocationTracking = () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setCoords(null);
  };

  const blockForLowBattery = () => {
    stopLocationTracking();
    setBatteryBlocked(true);
    setError(BATTERY_TOO_LOW_LOCATION_MESSAGE);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (await isBatteryTooLowForLocation()) {
        if (!cancelled) blockForLowBattery();
        return;
      }

      if (await Battery.isAvailableAsync()) {
        batteryListenerRef.current = Battery.addBatteryLevelListener(
          ({ batteryLevel }) => {
            if (
              batteryLevel >= 0 &&
              batteryLevel < MIN_BATTERY_FRACTION_FOR_LOCATION
            ) {
              blockForLowBattery();
            }
          }
        );
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      if (status !== Location.PermissionStatus.GRANTED) {
        setError("Location permission is required to show nearby pharmacies.");
        setLoading(false);
        return;
      }

      if (await isBatteryTooLowForLocation()) {
        if (!cancelled) blockForLowBattery();
        return;
      }

      try {
        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;

        if (await isBatteryTooLowForLocation()) {
          blockForLowBattery();
          return;
        }

        setCoords({
          latitude: initial.coords.latitude,
          longitude: initial.coords.longitude,
        });
        setLoading(false);

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
      stopLocationTracking();
      batteryListenerRef.current?.remove();
      batteryListenerRef.current = null;
    };
  }, []);

  return { coords, error, loading, batteryBlocked };
}
