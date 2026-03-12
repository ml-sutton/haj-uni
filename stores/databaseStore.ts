import { create } from "zustand";
import type { User } from "../models/user";

const SYNC_INTERVAL_MS = 30_000;

/** Hex-encoded encryption key derived from PIN; set after successful login, cleared on logout. */
type DatabaseStore = {
  /** Encrypted user data. Source of truth for (tabs); synced to DB periodically and on blur. */
  user: User | null;
  isAuthed: boolean;
  /** Session encryption key (derived from PIN). Never store the PIN; use this key for encrypt/decrypt. */
  encryptionKey: string | null;
  setUser: (user: User | null) => void;
  setIsAuthed: (isAuthed: boolean) => void;
  setEncryptionKey: (encryptionKey: string | null) => void;
  /** Clear auth state, session key, and in-memory user (e.g. on logout). */
  clearAuth: () => void;
};

export const useDatabaseStore = create<DatabaseStore>((set, get) => ({
  user: null,
  isAuthed: false,
  encryptionKey: null,
  setUser: (user) => set({ user }),
  setIsAuthed: (isAuthed) => set({ isAuthed }),
  setEncryptionKey: (encryptionKey) => set({ encryptionKey }),
  clearAuth: () => set({ isAuthed: false, encryptionKey: null, user: null }),
}));

/** Persist current store user to encrypted DB. No-op if key or user missing. Call from sync layer only. */
export async function persistStoreToDatabase(): Promise<void> {
  const { writeEncryptedDBObject } = await import("@/database/database");
  const state = useDatabaseStore.getState();
  if (!state.encryptionKey || !state.user) return;
  await writeEncryptedDBObject(state.user, state.encryptionKey);
}

/** Interval (ms) for periodic sync of store → database. */
export const SYNC_INTERVAL = SYNC_INTERVAL_MS;
