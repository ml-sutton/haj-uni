import {
  SecureStorageKeys,
  secureGetItem,
  secureMultiRemove,
  secureRemoveItem,
  secureSetItem,
} from "@/lib/secureStorage";
import { removeStoredEncryptionKey } from "@/service/biometricKeyStore";
import * as CryptoJS from "crypto-js";
import * as Crypto from "expo-crypto";
import type { SafePreferences } from "../models/preferences";
import { validateSafePreferences } from "../models/preferences";
import type { User } from "../models/user";
import { validateUser } from "../models/user";
import { deriveMnemonicWrapKey } from "../service/mnemonicCrypto";

/** AES-CBC IV length in bytes for wrap/encrypt operations. */
const AES_IV_BYTES = 16;

const SAFE_STORAGE_KEY = SecureStorageKeys.safe;
const ENCRYPTED_STORAGE_KEY = SecureStorageKeys.encrypted;
const SALT_STORAGE_KEY = SecureStorageKeys.salt;
const WRAPPED_MASTER_PIN_KEY = SecureStorageKeys.wrappedMasterPin;
const WRAPPED_MASTER_MNEMONIC_KEY = SecureStorageKeys.wrappedMasterMnemonic;

/** Iteration count for PIN-based key derivation (SHA-256 chain). */
const KDF_ITERATIONS = 10000;

/** Random salt length in bytes for PIN KDF. */
const SALT_BYTES = 16;

/**
 * Derives a 256-bit hex key from a PIN and salt using repeated SHA-256 hashing.
 *
 * @param pin - User PIN (never stored).
 * @param saltHex - Hex-encoded salt from secure storage.
 * @returns 64-character hex string used as a key-encryption key (KEK) or legacy DB key.
 */
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

/** Converts a byte array to a lowercase hex string. */
function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * AES-encrypts the master database key under a KEK (PIN- or mnemonic-derived).
 *
 * @param kekHex - Key-encryption key as hex.
 * @param masterKeyHex - 32-byte master key as 64-char hex.
 * @returns Stored form `ivHex:base64Ciphertext`.
 */
function wrapMasterKey(kekHex: string, masterKeyHex: string): string {
  const iv = Crypto.getRandomBytes(AES_IV_BYTES);
  const ivHex = uint8ArrayToHex(iv);
  const keyWA = CryptoJS.enc.Hex.parse(kekHex);
  const ivWA = CryptoJS.enc.Hex.parse(ivHex);
  const encrypted = CryptoJS.AES.encrypt(masterKeyHex, keyWA, { iv: ivWA });
  const ctBase64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
  return `${ivHex}:${ctBase64}`;
}

/**
 * Decrypts a wrapped master key using the matching KEK.
 *
 * @param kekHex - Key-encryption key as hex.
 * @param stored - Value from {@link wrapMasterKey} (`iv:ciphertext`).
 * @returns 64-char hex master key.
 * @throws {Error} When format is invalid or decryption fails.
 */
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

/** Generates a random 256-bit master encryption key as hex. */
function randomMasterKeyHex(): string {
  return uint8ArrayToHex(Crypto.getRandomBytes(32));
}

/** Reads the PIN-wrapped master key blob from secure storage, if present. */
async function readWrappedMasterKey(): Promise<string | null> {
  return secureGetItem(WRAPPED_MASTER_PIN_KEY);
}

/**
 * Registers a new account: random master key encrypts user data; PIN and mnemonic each wrap the master key.
 *
 * @param pin - User-chosen PIN (not persisted).
 * @param mnemonicNormalized - BIP39 phrase normalized by {@link deriveMnemonicWrapKey}.
 * @returns Master key hex for the current session (caller encrypts/writes user data).
 *
 * @remarks
 * Never stores the PIN or plaintext mnemonic—only salt and wrapped master key blobs.
 */
export async function registerWithMnemonic(
  pin: string,
  mnemonicNormalized: string
): Promise<string> {
  const kMnemonic = await deriveMnemonicWrapKey(mnemonicNormalized);
  const saltHex = uint8ArrayToHex(Crypto.getRandomBytes(SALT_BYTES));
  const masterKey = randomMasterKeyHex();
  const kPin = await deriveKey(pin, saltHex);
  await secureSetItem(SALT_STORAGE_KEY, saltHex);
  await secureSetItem(WRAPPED_MASTER_PIN_KEY, wrapMasterKey(kPin, masterKey));
  await secureSetItem(
    WRAPPED_MASTER_MNEMONIC_KEY,
    wrapMasterKey(kMnemonic, masterKey)
  );
  return masterKey;
}

/**
 * Whether the account was created with BIP39 recovery (mnemonic wrap present).
 *
 * @returns `true` when the mnemonic-wrapped master key is present in secure storage.
 */
export async function hasRecoveryEnabled(): Promise<boolean> {
  const w = await secureGetItem(WRAPPED_MASTER_MNEMONIC_KEY);
  return w !== null;
}

/**
 * Recovers access with a mnemonic, sets a new PIN wrap, and rotates the PIN salt.
 *
 * @param mnemonicNormalized - Valid recovery phrase (normalized).
 * @param newPin - New PIN to use going forward.
 * @returns Session `masterKey` and decrypted {@link User} (also re-written encrypted).
 *
 * @throws {Error} When recovery is not configured, phrase is wrong, or decryption fails.
 *
 * @remarks
 * Master key material is unchanged; only PIN-derived wrap and salt are rotated.
 */
export async function recoverAccountWithMnemonic(
  mnemonicNormalized: string,
  newPin: string
): Promise<{ masterKey: string; user: User }> {
  const wrapMnemonic = await secureGetItem(WRAPPED_MASTER_MNEMONIC_KEY);
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
  await secureSetItem(SALT_STORAGE_KEY, newSaltHex);
  await secureSetItem(WRAPPED_MASTER_PIN_KEY, newWrapPin);
  return { masterKey, user };
}

/**
 * Verifies the PIN and returns the master (or legacy derived) encryption key for the session.
 *
 * @param pin - User PIN attempt.
 * @returns 64-char hex key used with {@link readEncryptedDBObject} / {@link writeEncryptedDBObject}.
 *
 * @throws {Error} `"No PIN registered"` when salt is missing.
 * @throws {Error} `"Invalid PIN"` when unwrap or decryption fails.
 *
 * @remarks
 * Supports legacy accounts where the derived PIN key directly encrypts the database (no master wrap).
 */
export async function login(pin: string): Promise<string> {
  const saltHex = await secureGetItem(SALT_STORAGE_KEY);
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

/**
 * Changes the PIN while preserving the master key and re-encrypting user data.
 *
 * @param oldPin - Current PIN for verification.
 * @param newPin - Replacement PIN.
 *
 * @throws {Error} When no account exists or the current PIN is wrong.
 *
 * @remarks
 * Rotates salt and PIN wrap when master-key wrapping is enabled; legacy accounts rotate salt and derived key only.
 */
export async function changePin(oldPin: string, newPin: string): Promise<void> {
  const saltHex = await secureGetItem(SALT_STORAGE_KEY);
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
    await secureSetItem(SALT_STORAGE_KEY, newSaltHex);
    await secureSetItem(WRAPPED_MASTER_PIN_KEY, newWrapPin);
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
  await secureSetItem(SALT_STORAGE_KEY, newSaltHex);
}

/**
 * Parses a JSON string or throws a descriptive database error.
 *
 * @param raw - Serialized JSON from storage.
 * @returns Parsed value as `unknown`.
 * @throws {Error} When JSON is malformed.
 */
function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid JSON";
    throw new Error(`Database parse error: ${message}`);
  }
}

/**
 * Whether encrypted user data exists (registration / login gate).
 *
 * @returns `true` when the encrypted storage key has any stored value.
 */
export async function hasDatabaseObject(): Promise<boolean> {
  const raw = await secureGetItem(ENCRYPTED_STORAGE_KEY);
  return raw !== null;
}

/**
 * JSON shape exported for cloud backup or file export.
 *
 * @property encrypted - AES ciphertext blob (`iv:base64`) or legacy plaintext JSON.
 * @property salt - Hex salt for PIN KDF.
 * @property wrappedMasterByPin - Optional PIN-wrapped master key.
 * @property wrappedMasterByMnemonic - Optional mnemonic-wrapped master key.
 * @property safePreferences - Optional plaintext safe prefs included in the backup bundle.
 */
export type EncryptedBackupPayload = {
  encrypted: string;
  salt: string;
  wrappedMasterByPin?: string | null;
  wrappedMasterByMnemonic?: string | null;
  safePreferences?: SafePreferences;
};

/**
 * Validates and normalizes backup JSON into {@link EncryptedBackupPayload}.
 *
 * @param json - Serialized backup string.
 * @returns Parsed payload with validated `safePreferences` when present.
 * @throws {Error} When required fields are missing or safe prefs fail validation.
 */
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

/**
 * Builds a JSON backup string of encrypted data, salt, wraps, and optional safe preferences.
 *
 * @returns Stringified {@link EncryptedBackupPayload}.
 *
 * @throws {Error} `"No data to export"` when encrypted blob or salt is missing.
 */
export async function getEncryptedDataForExport(): Promise<string> {
  const encrypted = await secureGetItem(ENCRYPTED_STORAGE_KEY);
  const salt = await secureGetItem(SALT_STORAGE_KEY);
  if (!encrypted || !salt) throw new Error("No data to export");
  const wrappedPin = await secureGetItem(WRAPPED_MASTER_PIN_KEY);
  const wrappedMnemonic = await secureGetItem(WRAPPED_MASTER_MNEMONIC_KEY);
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

/**
 * Restores local database keys from an export JSON string (e.g. Firestore download).
 *
 * @param json - Output from {@link getEncryptedDataForExport} or compatible backup.
 *
 * @throws {Error} When backup format is invalid.
 *
 * @remarks
 * Overwrites encrypted blob, salt, wrap keys, and safe preferences when included.
 */
export async function importEncryptedBackup(json: string): Promise<void> {
  const data = parseEncryptedBackupPayload(json);
  await secureSetItem(ENCRYPTED_STORAGE_KEY, data.encrypted);
  await secureSetItem(SALT_STORAGE_KEY, data.salt);
  if (data.wrappedMasterByPin) {
    await secureSetItem(WRAPPED_MASTER_PIN_KEY, data.wrappedMasterByPin);
  } else {
    await secureRemoveItem(WRAPPED_MASTER_PIN_KEY);
  }
  if (data.wrappedMasterByMnemonic) {
    await secureSetItem(WRAPPED_MASTER_MNEMONIC_KEY, data.wrappedMasterByMnemonic);
  } else {
    await secureRemoveItem(WRAPPED_MASTER_MNEMONIC_KEY);
  }
  if (data.safePreferences) {
    await writeSafeDBObject(data.safePreferences);
  }
}

/**
 * Permanently removes all stored app data (encrypted user, salt, safe prefs, wraps, biometric key).
 *
 * @remarks
 * Intended for self-destruct and account wipe flows only.
 */
export async function clearAllData(): Promise<void> {
  await removeStoredEncryptionKey();
  await secureMultiRemove([
    ENCRYPTED_STORAGE_KEY,
    SALT_STORAGE_KEY,
    SAFE_STORAGE_KEY,
    WRAPPED_MASTER_PIN_KEY,
    WRAPPED_MASTER_MNEMONIC_KEY,
  ]);
}

/**
 * Reads and validates plaintext safe preferences from secure storage.
 *
 * @returns {@link SafePreferences}.
 *
 * @throws {Error} `"Safe database not found"` when the key is absent.
 * @throws {Error} Database parse or validation errors from {@link validateSafePreferences}.
 */
export async function readSafeDBObject(): Promise<SafePreferences> {
  const raw = await secureGetItem(SAFE_STORAGE_KEY);
  if (raw === null) {
    throw new Error("Safe database not found");
  }
  const data = parseJson(raw) as unknown;
  return validateSafePreferences(data);
}

/**
 * Reads and decrypts the encrypted user profile.
 *
 * @param key - 64-char hex encryption key (master or legacy derived).
 * @returns Validated {@link User}.
 *
 * @throws {Error} When blob is missing, format is invalid, or decryption fails.
 *
 * @remarks
 * If stored data starts with `{`, treats it as legacy unencrypted JSON and validates directly.
 */
export async function readEncryptedDBObject(key: string): Promise<User> {
  const raw = await secureGetItem(ENCRYPTED_STORAGE_KEY);
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

/**
 * Serializes and stores plaintext safe preferences.
 *
 * @param object - Preferences to persist (validated before write).
 */
export async function writeSafeDBObject(object: SafePreferences): Promise<void> {
  const validated = validateSafePreferences(object);
  const raw = JSON.stringify(validated);
  await secureSetItem(SAFE_STORAGE_KEY, raw);
}

/**
 * Validates, encrypts, and stores the user profile.
 *
 * @param object - User data to persist.
 * @param key - 64-char hex AES key (master or legacy derived).
 */
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
  await secureSetItem(ENCRYPTED_STORAGE_KEY, stored);
}
