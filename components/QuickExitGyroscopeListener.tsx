import { useQuickExitGyroscope } from "@/hooks/useQuickExitGyroscope";

/**
 * Invisible listener that wires gyroscope-based quick exit when the user is authenticated
 * and the quick-exit preference is enabled. Mount once near the app root.
 *
 * @returns Renders nothing (`null`); side effect only via {@link useQuickExitGyroscope}.
 */
export function QuickExitGyroscopeListener(): null {
  useQuickExitGyroscope();
  return null;
}
