import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DatabaseObject } from "../models/databaseObject";
import { validateSafePreferences } from "../models/preferences";
import { validateUser } from "../models/user";

const STORAGE_KEY = "@haj/database";

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid JSON";
    throw new Error(`Database parse error: ${message}`);
  }
}

async function readDatabaseObject(): Promise<DatabaseObject> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    throw new Error("Database not found");
  }
  const data = parseJson(raw) as { user: unknown; safePreferences: unknown };
  return {
    user: validateUser(data.user),
    safePreferences: validateSafePreferences(data.safePreferences),
  };
}

async function writeDatabaseObject(
  databaseObject: DatabaseObject
): Promise<void> {
  const user = validateUser(databaseObject.user);
  const safePreferences = validateSafePreferences(databaseObject.safePreferences);
  const payload: DatabaseObject = { user, safePreferences };
  const raw = JSON.stringify(payload);
  await AsyncStorage.setItem(STORAGE_KEY, raw);
}

export { readDatabaseObject, writeDatabaseObject };
