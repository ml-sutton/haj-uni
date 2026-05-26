import { SafePreferences } from "./preferences";
import { User } from "./user";

/**
 * Combined shape of persisted database partitions: encrypted user data and plaintext preferences.
 *
 * @property user - Profile, medications, notes, and secure preferences (encrypted at rest).
 * @property safePreferences - Theme, privacy toggles, and other non-sensitive settings (stored in the clear).
 */
export type DatabaseObject = {
  user: User;
  safePreferences: SafePreferences;
};
