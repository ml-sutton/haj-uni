import {
  isQuickExitEnabled,
  performQuickExitWithPanic,
} from "@/service/privacyService";
import { useDatabaseStore } from "@/stores/databaseStore";
import { useSafePreferencesStore } from "@/stores/safePreferencesStore";
import { Gyroscope, type GyroscopeMeasurement } from "expo-sensors";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";

/** Sample rate for jerk detection (~20 Hz). */
const UPDATE_INTERVAL_MS = 50;
/** Minimum angular speed (rad/s) to ignore sensor noise. */
const MIN_ANGULAR_SPEED_RAD_S = 5;
/** Sudden change in angular speed (rad/s²) indicating a sharp jerk. */
const ANGULAR_JERK_THRESHOLD_RAD_S2 = 55;
/** Consecutive jerking samples required before triggering. */
const JERK_STREAK_REQUIRED = 2;
const COOLDOWN_MS = 4_000;

function magnitude({ x, y, z }: GyroscopeMeasurement): number {
  return Math.sqrt(x * x + y * y + z * z);
}

function isJerkingMotion(
  current: GyroscopeMeasurement,
  previous: GyroscopeMeasurement | null,
  dtSec: number
): boolean {
  const speed = magnitude(current);
  if (speed < MIN_ANGULAR_SPEED_RAD_S) return false;
  if (!previous || dtSec <= 0) return false;
  const prevSpeed = magnitude(previous);
  const angularJerk = Math.abs(speed - prevSpeed) / dtSec;
  return angularJerk >= ANGULAR_JERK_THRESHOLD_RAD_S2;
}

/**
 * Listens to the gyroscope while the user is authenticated and quick exit is on.
 * A sharp jerk (sudden spike in angular velocity) triggers quick exit.
 */
export function useQuickExitGyroscope(): void {
  const router = useRouter();
  const isAuthed = useDatabaseStore((s) => s.isAuthed);
  const quickExitEnabled = useSafePreferencesStore((s) => s.quickExitEnabled);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastSampleRef = useRef<GyroscopeMeasurement | null>(null);
  const lastSampleTimeRef = useRef<number>(0);
  const jerkStreakRef = useRef(0);
  const cooldownUntilRef = useRef(0);
  const exitInFlightRef = useRef(false);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS === "web" || !isAuthed || !quickExitEnabled) {
      return;
    }

    let subscription: { remove: () => void } | null = null;
    let cancelled = false;

    void (async () => {
      const available = await Gyroscope.isAvailableAsync();
      if (!available || cancelled) return;

      Gyroscope.setUpdateInterval(UPDATE_INTERVAL_MS);
      subscription = Gyroscope.addListener((sample) => {
        if (appStateRef.current !== "active") return;
        if (Date.now() < cooldownUntilRef.current) return;
        if (exitInFlightRef.current) return;
        if (!isQuickExitEnabled()) return;

        const now = Date.now();
        const prev = lastSampleRef.current;
        const prevTime = lastSampleTimeRef.current;
        lastSampleRef.current = sample;
        lastSampleTimeRef.current = now;

        const dtSec = prevTime > 0 ? (now - prevTime) / 1000 : UPDATE_INTERVAL_MS / 1000;
        if (isJerkingMotion(sample, prev, dtSec)) {
          jerkStreakRef.current += 1;
        } else {
          jerkStreakRef.current = 0;
        }

        if (jerkStreakRef.current < JERK_STREAK_REQUIRED) return;

        exitInFlightRef.current = true;
        jerkStreakRef.current = 0;
        cooldownUntilRef.current = now + COOLDOWN_MS;
        void performQuickExitWithPanic(() => router.replace("/login")).finally(() => {
          exitInFlightRef.current = false;
        });
      });
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
      lastSampleRef.current = null;
      lastSampleTimeRef.current = 0;
      jerkStreakRef.current = 0;
    };
  }, [isAuthed, quickExitEnabled, router]);
}
