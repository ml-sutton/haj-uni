import { readEncryptedDBObject } from "@/database/database";
import { useDatabaseStore } from "@/stores/databaseStore";
import { persistStoreToDatabase, SYNC_INTERVAL } from "@/stores/databaseStore";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

/**
 * When (tabs) are mounted: hydrate store from DB if we have a key but no user,
 * then sync store → DB every SYNC_INTERVAL and when app goes to background/inactive.
 * Use this inside the tabs layout only.
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
