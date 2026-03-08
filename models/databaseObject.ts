import { SafePreferences } from "./preferences";
import { User } from "./user";

export type DatabaseObject = {
  user: User;
  safePreferences: SafePreferences;
};