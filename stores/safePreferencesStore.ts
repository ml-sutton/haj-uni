import { create } from "zustand";
import type { SafePreferences } from "@/models/preferences";
import { DEFAULT_SAFE_PREFERENCES } from "@/components/registration/registrationTypes";
import { readSafeDBObject, writeSafeDBObject } from "@/database/database";

type SafePreferencesStore = {
  /** All safe preference fields; source of truth. */
  theme: SafePreferences["theme"];
  discreteMode: SafePreferences["discreteMode"];
  selfDestructEnabled: SafePreferences["selfDestructEnabled"];
  quickExitEnabled: SafePreferences["quickExitEnabled"];
  silentMode: SafePreferences["silentMode"];
  notificationsEnabled: SafePreferences["notificationsEnabled"];
  biometricEnabled: SafePreferences["biometricEnabled"];
  setSafePreferences: (prefs: SafePreferences) => void;
  updateSafePreferences: (patch: Partial<SafePreferences>) => void;
  /** Load from DB into store. Call once when (tabs) mount. Keeps defaults on error. */
  hydrateFromDb: () => Promise<void>;
  /** Reset to defaults (e.g. after clearAllData). Does not write to DB. */
  resetToDefaults: () => void;
};

function persistToDbAsync(prefs: SafePreferences): void {
  writeSafeDBObject(prefs).catch(() => {});
}

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

/** Get current safe preferences (e.g. outside React). */
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
