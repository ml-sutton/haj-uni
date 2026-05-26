import { create } from "zustand";
import type { SafePreferences } from "@/models/preferences";
import { DEFAULT_SAFE_PREFERENCES } from "@/components/registration/registrationTypes";
import { readSafeDBObject, writeSafeDBObject } from "@/database/database";

/**
 * Zustand state for non-encrypted preferences (theme, privacy toggles, notifications).
 *
 * @remarks Updates persist asynchronously to the safe DB object; use {@link hydrateFromDb} on tabs mount.
 */
type SafePreferencesStore = {
  /** All safe preference fields; source of truth while tabs are active. */
  theme: SafePreferences["theme"];
  discreteMode: SafePreferences["discreteMode"];
  selfDestructEnabled: SafePreferences["selfDestructEnabled"];
  quickExitEnabled: SafePreferences["quickExitEnabled"];
  silentMode: SafePreferences["silentMode"];
  notificationsEnabled: SafePreferences["notificationsEnabled"];
  biometricEnabled: SafePreferences["biometricEnabled"];
  /** Replaces all fields and persists to DB. */
  setSafePreferences: (prefs: SafePreferences) => void;
  /** Merges a partial update and persists to DB. */
  updateSafePreferences: (patch: Partial<SafePreferences>) => void;
  /** Loads from DB into store. Call once when (tabs) mount. Keeps defaults on error. */
  hydrateFromDb: () => Promise<void>;
  /** Resets to defaults in memory only (e.g. after clearAllData). Does not write to DB. */
  resetToDefaults: () => void;
};

function persistToDbAsync(prefs: SafePreferences): void {
  writeSafeDBObject(prefs).catch(() => {});
}

/**
 * Zustand hook for safe (non-encrypted) user preferences.
 *
 * @returns Store state and actions; selectors recommended to limit re-renders.
 */
export const useSafePreferencesStore = create<SafePreferencesStore>((set, get) => ({
  ...DEFAULT_SAFE_PREFERENCES,

  setSafePreferences: (prefs) => {
    set(prefs);
    persistToDbAsync(prefs);
  },

  updateSafePreferences: (patch) => {
    const next: SafePreferences = {
      theme: get().theme,
      discreteMode: get().discreteMode,
      selfDestructEnabled: get().selfDestructEnabled,
      quickExitEnabled: get().quickExitEnabled,
      silentMode: get().silentMode,
      notificationsEnabled: get().notificationsEnabled,
      biometricEnabled: get().biometricEnabled,
      ...patch,
    };
    set(next);
    persistToDbAsync(next);
  },

  hydrateFromDb: async () => {
    try {
      const prefs = await readSafeDBObject();
      set(prefs);
    } catch {
      // No DB or invalid; keep defaults
    }
  },

  resetToDefaults: () => {
    set(DEFAULT_SAFE_PREFERENCES);
  },
}));

/**
 * Snapshot of current safe preferences outside React components.
 *
 * @returns Plain `SafePreferences` object from the latest store state.
 * @remarks Used by privacy helpers and services that cannot call hooks.
 */
export function getSafePreferences(): SafePreferences {
  const s = useSafePreferencesStore.getState();
  return {
    theme: s.theme,
    discreteMode: s.discreteMode,
    selfDestructEnabled: s.selfDestructEnabled,
    quickExitEnabled: s.quickExitEnabled,
    silentMode: s.silentMode,
    notificationsEnabled: s.notificationsEnabled,
    biometricEnabled: s.biometricEnabled,
  };
}
