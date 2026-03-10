import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import type { SafePreferences } from "../models/preferences";
import { validateSafePreferences } from "../models/preferences";
import type { User } from "../models/user";
import { validateUser } from "../models/user";

const SAFE_STORAGE_KEY = "@haj/database/safe";
const ENCRYPTED_STORAGE_KEY = "@haj/database/encrypted";
const SALT_STORAGE_KEY = "@haj/database/salt";
const DERIVED_KEY_STORAGE_KEY = "@haj/database/derivedKey";

const KDF_ITERATIONS = 10000;
const SALT_BYTES = 16;

/** Derive a 256-bit key from PIN and salt using SHA-256 iteration. */
async function deriveKey(pin: string, saltHex: string): Promise<string> {
  let key = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    saltHex + pin
  );
  for (let i = 0; i < KDF_ITERATIONS - 1; i++) {
    key = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      key + saltHex + pin
    );
  }
  return key;
}

/** Constant-time comparison to avoid timing attacks. */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// register pin
export async function registerPin(pin: string): Promise<void> {
  const salt = Crypto.getRandomBytes(SALT_BYTES);
  const saltHex = uint8ArrayToHex(salt);
  const derivedKey = await deriveKey(pin, saltHex);
  await AsyncStorage.multiSet([
    [SALT_STORAGE_KEY, saltHex],
    [DERIVED_KEY_STORAGE_KEY, derivedKey],
  ]);
}
// end register pin

// Login
/** Verifies PIN and returns the derived encryption key on success. Does not store the PIN. */
export async function login(pin: string): Promise<string> {
  const saltHex = await AsyncStorage.getItem(SALT_STORAGE_KEY);
  const storedKey = await AsyncStorage.getItem(DERIVED_KEY_STORAGE_KEY);
  if (saltHex === null || storedKey === null) {
    throw new Error("No PIN registered");
  }
  const derivedKey = await deriveKey(pin, saltHex);
  if (!constantTimeCompare(derivedKey, storedKey)) {
    throw new Error("Invalid PIN");
  }
  return derivedKey;
}
// end login

// change pin
export async function changePin(oldPin: string, newPin: string): Promise<void> {
  const saltHex = await AsyncStorage.getItem(SALT_STORAGE_KEY);
  const storedKey = await AsyncStorage.getItem(DERIVED_KEY_STORAGE_KEY);
  if (saltHex === null || storedKey === null) {
    throw new Error("No PIN registered");
  }
  const oldDerived = await deriveKey(oldPin, saltHex);
  if (!constantTimeCompare(oldDerived, storedKey)) {
    throw new Error("Invalid current PIN");
  }
  const newSalt = Crypto.getRandomBytes(SALT_BYTES);
  const newSaltHex = uint8ArrayToHex(newSalt);
  const newDerivedKey = await deriveKey(newPin, newSaltHex);
  await AsyncStorage.multiSet([
    [SALT_STORAGE_KEY, newSaltHex],
    [DERIVED_KEY_STORAGE_KEY, newDerivedKey],
  ]);
}
// end change pin
function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid JSON";
    throw new Error(`Database parse error: ${message}`);
  }
}

/** Returns true if the encrypted (user) object exists. Used for registration/auth flow. */
export async function hasDatabaseObject(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(ENCRYPTED_STORAGE_KEY);
  return raw !== null;
}

/** Read safe (plaintext) data: SafePreferences. */
export async function readSafeDBObject(): Promise<SafePreferences> {
  const raw = await AsyncStorage.getItem(SAFE_STORAGE_KEY);
  if (raw === null) {
    throw new Error("Safe database not found");
  }
  const data = parseJson(raw) as unknown;
  return validateSafePreferences(data);
}

/** Read encrypted (user) data. No encryption applied yet. */
export async function readEncryptedDBObject(): Promise<User> {
  const raw = await AsyncStorage.getItem(ENCRYPTED_STORAGE_KEY);
  if (raw === null) {
    throw new Error("Encrypted database not found");
  }
  const data = parseJson(raw) as unknown;
  return validateUser(data);
}

/** Write safe (plaintext) data. */
export async function writeSafeDBObject(object: SafePreferences): Promise<void> {
  const validated = validateSafePreferences(object);
  const raw = JSON.stringify(validated);
  await AsyncStorage.setItem(SAFE_STORAGE_KEY, raw);
}

/** Write encrypted (user) data. No encryption applied yet. */
export async function writeEncryptedDBObject(object: User): Promise<void> {
  const validated = validateUser(object);
  const raw = JSON.stringify(validated);
  await AsyncStorage.setItem(ENCRYPTED_STORAGE_KEY, raw);
}
