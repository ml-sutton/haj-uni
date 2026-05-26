import {
  entropyToMnemonic,
  mnemonicToSeedSync,
  validateMnemonic,
} from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import * as Crypto from "expo-crypto";

const MNEMONIC_KDF_DOMAIN = "haj-uni/bip39-wrap/v1";
const KDF_ITERATIONS = 10000;

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generates a new BIP39 recovery phrase for account registration or recovery setup.
 *
 * @returns A 24-word English mnemonic (256 bits of entropy).
 * @remarks **Security:** Treat the return value as a secret. Display it only in a controlled onboarding flow; never persist the plaintext phrase in logs, analytics, or cloud backup.
 * @example
 * ```ts
 * const phrase = generate24WordMnemonic();
 * await registerWithMnemonic(phrase, pin);
 * ```
 */
export function generate24WordMnemonic(): string {
  // React Native may not expose globalThis.crypto.getRandomValues.
  // Use Expo's CSPRNG directly and convert entropy to a valid BIP39 phrase.
  const entropy = Crypto.getRandomBytes(32);
  return entropyToMnemonic(entropy, wordlist);
}

/**
 * Normalizes user-entered mnemonic text for validation and KDF input.
 *
 * @param phrase - Raw phrase from input (any casing/spacing).
 * @returns Lowercase words separated by single spaces, trimmed.
 */
export function normalizeMnemonicPhrase(phrase: string): string {
  return phrase.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Checks whether a phrase is a valid BIP39 mnemonic in the English wordlist.
 *
 * @param phrase - User input; normalized internally.
 * @returns `true` when checksum and word count are valid.
 */
export function isValidMnemonicPhrase(phrase: string): boolean {
  const n = normalizeMnemonicPhrase(phrase);
  if (!n) return false;
  return validateMnemonic(n, wordlist);
}

/**
 * Derives a 256-bit hex wrap key from a valid BIP39 mnemonic.
 *
 * @param normalizedMnemonic - Already normalized phrase (see {@link normalizeMnemonicPhrase}).
 * @returns Hex-encoded key used to unwrap the master encryption key (same shape as PIN KDF output).
 * @throws When the mnemonic fails BIP39 validation (`"Invalid recovery phrase"`).
 * @remarks **Security:** The mnemonic itself is never stored. This key is derived via domain-separated SHA-256 iterations; do not use the mnemonic or derived key for unrelated purposes.
 */
export async function deriveMnemonicWrapKey(
  normalizedMnemonic: string
): Promise<string> {
  if (!validateMnemonic(normalizedMnemonic, wordlist)) {
    throw new Error("Invalid recovery phrase");
  }
  const seed = mnemonicToSeedSync(normalizedMnemonic, "");
  const seedHex = uint8ArrayToHex(seed);
  let key = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    MNEMONIC_KDF_DOMAIN + seedHex
  );
  for (let i = 0; i < KDF_ITERATIONS - 1; i++) {
    key = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      key + MNEMONIC_KDF_DOMAIN + seedHex
    );
  }
  return key;
}
