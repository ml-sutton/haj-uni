import { removeStoredEncryptionKey } from "@/service/biometricKeyStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as CryptoJS from "crypto-js";
import * as Crypto from "expo-crypto";
import type { SafePreferences } from "../models/preferences";
import { validateSafePreferences } from "../models/preferences";
import type { User } from "../models/user";
import { validateUser } from "../models/user";
import { deriveMnemonicWrapKey } from "../service/mnemonicCrypto";

const AES_IV_BYTES = 16;

const SAFE_STORAGE_KEY = "@haj/database/safe";
const ENCRYPTED_STORAGE_KEY = "@haj/database/encrypted";
const SALT_STORAGE_KEY = "@haj/database/salt";
const WRAPPED_MASTER_PIN_KEY = "@haj/database/wrapped_master_pin";
const WRAPPED_MASTER_MNEMONIC_KEY = "@haj/database/wrapped_master_mnemonic";

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

function wrapMasterKey(kekHex: string, masterKeyHex: string): string {
  const iv = Crypto.getRandomBytes(AES_IV_BYTES);
  const ivHex = uint8ArrayToHex(iv);
  const keyWA = CryptoJS.enc.Hex.parse(kekHex);
  const ivWA = CryptoJS.enc.Hex.parse(ivHex);
  const encrypted = CryptoJS.AES.encrypt(masterKeyHex, keyWA, { iv: ivWA });
  const ctBase64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
  return `${ivHex}:${ctBase64}`;
}

function unwrapMasterKey(kekHex: string, stored: string): string {
  const [ivHex, ctBase64] = stored.split(":");
  if (!ivHex || !ctBase64) {
    throw new Error("Invalid wrap format");
  }
  const keyWA = CryptoJS.enc.Hex.parse(kekHex);
  const ivWA = CryptoJS.enc.Hex.parse(ivHex);
  const ctWA = CryptoJS.enc.Base64.parse(ctBase64);
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: ctWA } as CryptoJS.lib.CipherParams,
    keyWA,
    { iv: ivWA }
  );
  const out = decrypted.toString(CryptoJS.enc.Utf8);
  if (!out || !/^[0-9a-f]{64}$/i.test(out)) {
    throw new Error("Unwrap failed");
  }
  return out.toLowerCase();
}

function randomMasterKeyHex(): string {
  return uint8ArrayToHex(Crypto.getRandomBytes(32));
}

async function readWrappedMasterKey(): Promise<string | null> {
  return AsyncStorage.getItem(WRAPPED_MASTER_PIN_KEY);
}

/**
 * Register PIN + BIP39 mnemonic: random master key encrypts user data; PIN and mnemonic
 * each wrap the master key (never store PIN or plaintext mnemonic).
 */
export async function registerWithMnemonic(
  pin: string,
  mnemonicNormalized: string
): Promise<string> {
  const kMnemonic = await deriveMnemonicWrapKey(mnemonicNormalized);
  const saltHex = uint8ArrayToHex(Crypto.getRandomBytes(SALT_BYTES));
  const masterKey = randomMasterKeyHex();
  const kPin = await deriveKey(pin, saltHex);
  await AsyncStorage.setItem(SALT_STORAGE_KEY, saltHex);
  await AsyncStorage.setItem(
    WRAPPED_MASTER_PIN_KEY,
    wrapMasterKey(kPin, masterKey)
  );
  await AsyncStorage.setItem(
    WRAPPED_MASTER_MNEMONIC_KEY,
    wrapMasterKey(kMnemonic, masterKey)
  );
  return masterKey;
}

/** True when account was created with BIP39 recovery (mnemonic wrap present). */
export async function hasRecoveryEnabled(): Promise<boolean> {
  const w = await AsyncStorage.getItem(WRAPPED_MASTER_MNEMONIC_KEY);
  return w !== null;
}

/**
 * Decrypt with mnemonic-derived key, re-wrap master with new PIN and new salt.
 * Returns master key for session (same master; only PIN wrap + salt rotate).
 */
export async function recoverAccountWithMnemonic(
  mnemonicNormalized: string,
  newPin: string
): Promise<{ masterKey: string; user: User }> {
  const wrapMnemonic = await AsyncStorage.getItem(WRAPPED_MASTER_MNEMONIC_KEY);
  if (!wrapMnemonic) {
    throw new Error("Recovery is not set up for this account");
  }
  const kMnemonic = await deriveMnemonicWrapKey(mnemonicNormalized);
  let masterKey: string;
  try {
    masterKey = unwrapMasterKey(kMnemonic, wrapMnemonic);
  } catch {
    throw new Error("Invalid recovery phrase");
  }
  let user: User;
  try {
    user = await readEncryptedDBObject(masterKey);
  } catch {
    throw new Error("Invalid recovery phrase");
  }
  const newSaltHex = uint8ArrayToHex(Crypto.getRandomBytes(SALT_BYTES));
  const kNewPin = await deriveKey(newPin, newSaltHex);
  const newWrapPin = wrapMasterKey(kNewPin, masterKey);
  await writeEncryptedDBObject(user, masterKey);
  await AsyncStorage.setItem(SALT_STORAGE_KEY, newSaltHex);
  await AsyncStorage.setItem(WRAPPED_MASTER_PIN_KEY, newWrapPin);
  return { masterKey, user };
}

// Login
/** Verifies PIN by unwrapping master key (or legacy: derive key = DB key). */
export async function login(pin: string): Promise<string> {
  const saltHex = await AsyncStorage.getItem(SALT_STORAGE_KEY);
  if (saltHex === null) {
    throw new Error("No PIN registered");
  }
  const wrapPin = await readWrappedMasterKey();
  if (wrapPin !== null) {
    const kPin = await deriveKey(pin, saltHex);
    let masterKey: string;
    try {
      masterKey = unwrapMasterKey(kPin, wrapPin);
    } catch {
      throw new Error("Invalid PIN");
    }
    try {
      await readEncryptedDBObject(masterKey);
    } catch {
      throw new Error("Invalid PIN");
    }
    return masterKey;
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
  const wrapPin = await readWrappedMasterKey();
  if (wrapPin !== null) {
    const kOld = await deriveKey(oldPin, saltHex);
    let masterKey: string;
    try {
      masterKey = unwrapMasterKey(kOld, wrapPin);
    } catch {
      throw new Error("Invalid current PIN");
    }
    let user: User;
    try {
      user = await readEncryptedDBObject(masterKey);
    } catch {
      throw new Error("Invalid current PIN");
    }
    const newSaltHex = uint8ArrayToHex(Crypto.getRandomBytes(SALT_BYTES));
    const kNew = await deriveKey(newPin, newSaltHex);
    const newWrapPin = wrapMasterKey(kNew, masterKey);
    await writeEncryptedDBObject(user, masterKey);
    await AsyncStorage.setItem(SALT_STORAGE_KEY, newSaltHex);
    await AsyncStorage.setItem(WRAPPED_MASTER_PIN_KEY, newWrapPin);
    return;
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

export type EncryptedBackupPayload = {
  encrypted: string;
  salt: string;
  wrappedMasterByPin?: string | null;
  wrappedMasterByMnemonic?: string | null;
  safePreferences?: SafePreferences;
};

function parseEncryptedBackupPayload(json: string): EncryptedBackupPayload {
  const data = parseJson(json) as EncryptedBackupPayload;
  if (!data?.encrypted || !data?.salt) {
    throw new Error("Invalid backup format");
  }
  if (data.safePreferences != null) {
    data.safePreferences = validateSafePreferences(data.safePreferences);
  }
  return data;
}

/** Export encrypted payload and salt as JSON string for backup. Throws if no data. */
export async function getEncryptedDataForExport(): Promise<string> {
  const encrypted = await AsyncStorage.getItem(ENCRYPTED_STORAGE_KEY);
  const salt = await AsyncStorage.getItem(SALT_STORAGE_KEY);
  if (!encrypted || !salt) throw new Error("No data to export");
  const wrappedPin = await AsyncStorage.getItem(WRAPPED_MASTER_PIN_KEY);
  const wrappedMnemonic = await AsyncStorage.getItem(WRAPPED_MASTER_MNEMONIC_KEY);
  let safePreferences: SafePreferences | undefined;
  try {
    safePreferences = await readSafeDBObject();
  } catch {
    safePreferences = undefined;
  }
  const payload: EncryptedBackupPayload = {
    encrypted,
    salt,
    wrappedMasterByPin: wrappedPin,
    wrappedMasterByMnemonic: wrappedMnemonic,
    safePreferences,
  };
  return JSON.stringify(payload);
}

/** Restore encrypted backup from export JSON (e.g. Firestore download). Overwrites local DB keys. */
export async function importEncryptedBackup(json: string): Promise<void> {
  const data = parseEncryptedBackupPayload(json);
  await AsyncStorage.setItem(ENCRYPTED_STORAGE_KEY, data.encrypted);
  await AsyncStorage.setItem(SALT_STORAGE_KEY, data.salt);
  if (data.wrappedMasterByPin) {
    await AsyncStorage.setItem(WRAPPED_MASTER_PIN_KEY, data.wrappedMasterByPin);
  } else {
    await AsyncStorage.removeItem(WRAPPED_MASTER_PIN_KEY);
  }
  if (data.wrappedMasterByMnemonic) {
    await AsyncStorage.setItem(
      WRAPPED_MASTER_MNEMONIC_KEY,
      data.wrappedMasterByMnemonic
    );
  } else {
    await AsyncStorage.removeItem(WRAPPED_MASTER_MNEMONIC_KEY);
  }
  if (data.safePreferences) {
    await writeSafeDBObject(data.safePreferences);
  }
}

/** Permanently removes all stored app data (encrypted user data, salt, safe prefs). Use for self-destruct only. */
export async function clearAllData(): Promise<void> {
  await removeStoredEncryptionKey();
  await AsyncStorage.multiRemove([
    ENCRYPTED_STORAGE_KEY,
    SALT_STORAGE_KEY,
    SAFE_STORAGE_KEY,
    WRAPPED_MASTER_PIN_KEY,
    WRAPPED_MASTER_MNEMONIC_KEY,
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
