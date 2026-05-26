import { useQuickExitGyroscope } from "@/hooks/useQuickExitGyroscope";

/** Mount near the app root to enable shake-to-quick-exit when the feature is on. */
export function QuickExitGyroscopeListener(): null {
  useQuickExitGyroscope();
  return null;
}
