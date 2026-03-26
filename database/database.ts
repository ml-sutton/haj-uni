import { removeStoredEncryptionKey } from "@/service/biometricKeyStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as CryptoJS from "crypto-js";
import * as Crypto from "expo-crypto";
import type { SafePreferences } from "../models/preferences";
import { validateSafePreferences } from "../models/preferences";
import type { User } from "../models/user";
import { validateUser } from "../models/user";

const AES_IV_BYTES = 16;

const SAFE_STORAGE_KEY = "@haj/database/safe";
const ENCRYPTED_STORAGE_KEY = "@haj/database/encrypted";
const SALT_STORAGE_KEY = "@haj/database/salt";

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

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// register pin
/** Stores only the salt (data to compute the key). Returns the derived key for one-time use (e.g. to encrypt initial data). */
export async function registerPin(pin: string): Promise<string> {
  const salt = Crypto.getRandomBytes(SALT_BYTES);
  const saltHex = uint8ArrayToHex(salt);
  const derivedKey = await deriveKey(pin, saltHex);
  await AsyncStorage.setItem(SALT_STORAGE_KEY, saltHex);
  return derivedKey;
}
// end register pin

// Login
/** Verifies PIN by deriving key and attempting to decrypt stored data. Returns the derived key on success. Does not store the PIN or the key. */
export async function login(pin: string): Promise<string> {
  const saltHex = await AsyncStorage.getItem(SALT_STORAGE_KEY);
  if (saltHex === null) {
    throw new Error("No PIN registered");
  }
  const derivedKey = await deriveKey(pin, saltHex);
  try {
    await readEncryptedDBObject(derivedKey);
  } catch {
    throw new Error("Invalid PIN");
  }
  return derivedKey;
}
// end login

// change pin
export async function changePin(oldPin: string, newPin: string): Promise<void> {
  const saltHex = await AsyncStorage.getItem(SALT_STORAGE_KEY);
  if (saltHex === null) {
    throw new Error("No PIN registered");
  }
  const oldKey = await deriveKey(oldPin, saltHex);
  let user: User;
  try {
    user = await readEncryptedDBObject(oldKey);
  } catch {
    throw new Error("Invalid current PIN");
  }
  const newSalt = Crypto.getRandomBytes(SALT_BYTES);
  const newSaltHex = uint8ArrayToHex(newSalt);
  const newKey = await deriveKey(newPin, newSaltHex);
  await writeEncryptedDBObject(user, newKey);
  await AsyncStorage.setItem(SALT_STORAGE_KEY, newSaltHex);
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

/** Export encrypted payload and salt as JSON string for backup. Throws if no data. */
export async function getEncryptedDataForExport(): Promise<string> {
  const encrypted = await AsyncStorage.getItem(ENCRYPTED_STORAGE_KEY);
  const salt = await AsyncStorage.getItem(SALT_STORAGE_KEY);
  if (!encrypted || !salt) throw new Error("No data to export");
  return JSON.stringify({ encrypted, salt });
}

/** Permanently removes all stored app data (encrypted user data, salt, safe prefs). Use for self-destruct only. */
export async function clearAllData(): Promise<void> {
  await removeStoredEncryptionKey();
  await AsyncStorage.multiRemove([
    ENCRYPTED_STORAGE_KEY,
    SALT_STORAGE_KEY,
    SAFE_STORAGE_KEY,
  ]);
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

/** Read encrypted (user) data. Decrypts with the given key (hex). Supports legacy plaintext JSON for migration. */
export async function readEncryptedDBObject(key: string): Promise<User> {
  const raw = await AsyncStorage.getItem(ENCRYPTED_STORAGE_KEY);
  if (raw === null) {
    throw new Error("Encrypted database not found");
  }
  if (raw.startsWith("{")) {
    const data = parseJson(raw) as unknown;
    return validateUser(data);
  }
  const [ivHex, ctBase64] = raw.split(":");
  if (!ivHex || !ctBase64) {
    throw new Error("Encrypted database invalid format");
  }
  const keyWA = CryptoJS.enc.Hex.parse(key);
  const ivWA = CryptoJS.enc.Hex.parse(ivHex);
  const ctWA = CryptoJS.enc.Base64.parse(ctBase64);
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: ctWA } as CryptoJS.lib.CipherParams,
    keyWA,
    { iv: ivWA }
  );
  const json = decrypted.toString(CryptoJS.enc.Utf8);
  if (!json) {
    throw new Error("Decryption failed");
  }
  const data = parseJson(json) as unknown;
  return validateUser(data);
}

/** Write safe (plaintext) data. */
export async function writeSafeDBObject(object: SafePreferences): Promise<void> {
  const validated = validateSafePreferences(object);
  const raw = JSON.stringify(validated);
  await AsyncStorage.setItem(SAFE_STORAGE_KEY, raw);
}

/** Write encrypted (user) data. Encrypts with the given key (hex). */
export async function writeEncryptedDBObject(
  object: User,
  key: string
): Promise<void> {
  const validated = validateUser(object);
  const json = JSON.stringify(validated);
  const iv = Crypto.getRandomBytes(AES_IV_BYTES);
  const ivHex = uint8ArrayToHex(iv);
  const keyWA = CryptoJS.enc.Hex.parse(key);
  const ivWA = CryptoJS.enc.Hex.parse(ivHex);
  const encrypted = CryptoJS.AES.encrypt(json, keyWA, { iv: ivWA });
  const ctBase64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
  const stored = `${ivHex}:${ctBase64}`;
  await AsyncStorage.setItem(ENCRYPTED_STORAGE_KEY, stored);
}
