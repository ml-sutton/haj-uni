import { readEncryptedDBObject } from "@/database/database";
import { useDatabaseStore } from "@/stores/databaseStore";
import { persistStoreToDatabase, SYNC_INTERVAL } from "@/stores/databaseStore";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

/**
 * Keeps the encrypted user store in sync with on-disk data while the tabs layout is mounted.
 *
 * @returns Nothing; side effects only.
 * @remarks On mount: hydrates `user` from DB when `encryptionKey` exists but `user` is null. Then persists store → DB every {@link SYNC_INTERVAL} and when the app leaves the active foreground state. Mount only inside the tabs layout.
 * @example
 * ```tsx
 * export default function TabsLayout() {
 *   useStoreSync();
 *   return <Tabs />;
 * }
 * ```
 */
export function useStoreSync(): void {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const encryptionKey = useDatabaseStore.getState().encryptionKey;
    const user = useDatabaseStore.getState().user;

    const hydrate = async () => {
      if (!encryptionKey) return;
      try {
        const data = await readEncryptedDBObject(encryptionKey);
        useDatabaseStore.getState().setUser(data);
      } catch {
        // e.g. invalid key or corrupted data; leave user null
      }
    };

    if (encryptionKey && user === null) {
      hydrate();
    }

    const syncToDb = () => {
      persistStoreToDatabase().catch(() => {
        // ignore; will retry on next interval or next blur
      });
    };

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (
        appStateRef.current === "active" &&
        (nextState === "background" || nextState === "inactive")
      ) {
        syncToDb();
      }
      appStateRef.current = nextState;
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    intervalRef.current = setInterval(syncToDb, SYNC_INTERVAL);

    return () => {
      subscription.remove();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
}
