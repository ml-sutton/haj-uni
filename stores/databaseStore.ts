import { create } from "zustand";
import type { DatabaseObject } from "../models/databaseObject";

/** Hex-encoded encryption key derived from PIN; set after successful login, cleared on logout. */
type DatabaseStore = {
  databaseObject: DatabaseObject | null;
  isAuthed: boolean;
  /** Session encryption key (derived from PIN). Never store the PIN; use this key for encrypt/decrypt. */
  encryptionKey: string | null;
  setDatabaseObject: (databaseObject: DatabaseObject | null) => void;
  setIsAuthed: (isAuthed: boolean) => void;
  setEncryptionKey: (encryptionKey: string | null) => void;
  /** Clear auth state and session key (e.g. on logout). */
  clearAuth: () => void;
};

export const useDatabaseStore = create<DatabaseStore>((set) => ({
  databaseObject: null,
  isAuthed: false,
  encryptionKey: null,
  setDatabaseObject: (databaseObject: DatabaseObject | null) => set({ databaseObject }),
  setIsAuthed: (isAuthed: boolean) => set({ isAuthed }),
  setEncryptionKey: (encryptionKey: string | null) => set({ encryptionKey }),
  clearAuth: () => set({ isAuthed: false, encryptionKey: null }),
}));
