import {
  BATTERY_TOO_LOW_LOCATION_MESSAGE,
  isBatteryTooLowForLocation,
  MIN_BATTERY_FRACTION_FOR_LOCATION,
} from "@/utils/batteryPolicy";
import * as Battery from "expo-battery";
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
  batteryBlocked: boolean;
};

/**
 * Foreground location updates only while the caller is mounted.
 * Blocked when battery is below 30%. Subscription removed on unmount.
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
