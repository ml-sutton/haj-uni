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

/** 24-word BIP39 phrase (256 bits entropy). */
export function generate24WordMnemonic(): string {
  // React Native may not expose globalThis.crypto.getRandomValues.
  // Use Expo's CSPRNG directly and convert entropy to a valid BIP39 phrase.
  const entropy = Crypto.getRandomBytes(32);
  return entropyToMnemonic(entropy, wordlist);
}

export function normalizeMnemonicPhrase(phrase: string): string {
  return phrase.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isValidMnemonicPhrase(phrase: string): boolean {
  const n = normalizeMnemonicPhrase(phrase);
  if (!n) return false;
  return validateMnemonic(n, wordlist);
}

/**
 * Derives a 256-bit hex key from a valid BIP39 mnemonic (same shape as PIN KDF output).
 * Used only to unwrap the master encryption key — mnemonic is never stored.
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
