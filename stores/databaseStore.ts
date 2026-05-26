import { create } from "zustand";
import type { User } from "../models/user";

const SYNC_INTERVAL_MS = 30_000;

/**
 * In-memory session and encrypted user state for the authenticated app shell.
 *
 * @remarks The PIN is never stored—only a hex `encryptionKey` derived after unlock.
 */
type DatabaseStore = {
  /** Encrypted user data. Source of truth for (tabs); synced to DB periodically and on blur. */
  user: User | null;
  /** Whether the user has an active session (unlocked). */
  isAuthed: boolean;
  /** Session encryption key (derived from PIN). Used for encrypt/decrypt of `user`. */
  encryptionKey: string | null;
  /** Replaces in-memory user (e.g. after edits in tabs). */
  setUser: (user: User | null) => void;
  /** Sets authenticated flag without changing key or user. */
  setIsAuthed: (isAuthed: boolean) => void;
  /** Sets or clears the session encryption key. */
  setEncryptionKey: (encryptionKey: string | null) => void;
  /** Clears auth flag, session key, and in-memory user (logout / quick exit). */
  clearAuth: () => void;
};

/**
 * Zustand store for authenticated session: user payload, auth flag, and encryption key.
 *
 * @returns Hook selectors and `getState()` for imperative access.
 * @remarks **Security:** `encryptionKey` grants full decrypt access—clear via `clearAuth()` on logout.
 */
export const useDatabaseStore = create<DatabaseStore>((set, get) => ({
  user: null,
  isAuthed: false,
  encryptionKey: null,
  setUser: (user) => set({ user }),
  setIsAuthed: (isAuthed) => set({ isAuthed }),
  setEncryptionKey: (encryptionKey) => set({ encryptionKey }),
  clearAuth: () => set({ isAuthed: false, encryptionKey: null, user: null }),
}));

/**
 * Writes the current in-memory `user` to the encrypted local database.
 *
 * @returns Resolves when persisted or immediately if `encryptionKey` or `user` is missing.
 * @remarks Intended for the sync layer only ({@link useStoreSync}, quick exit)—not for arbitrary UI calls.
 */
export async function persistStoreToDatabase(): Promise<void> {
  const { writeEncryptedDBObject } = await import("@/database/database");
  const state = useDatabaseStore.getState();
  if (!state.encryptionKey || !state.user) return;
  await writeEncryptedDBObject(state.user, state.encryptionKey);
}

/**
 * Interval in milliseconds for periodic store → database sync while tabs are mounted.
 */
export const SYNC_INTERVAL = SYNC_INTERVAL_MS;
