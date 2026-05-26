import {
  SecureStorageKeys,
  secureGetItem,
  secureMultiRemove,
  secureSetItem,
} from "@/lib/secureStorage";

const POLICY_KEY = SecureStorageKeys.authPolicy;
const FAILED_ATTEMPTS_KEY = SecureStorageKeys.failedPinAttempts;
const DEFAULT_SELF_DESTRUCT_AFTER = 5;

type AuthPolicy = {
  selfDestructAfterFailedAttempts: number;
};

/**
 * Reads how many consecutive failed PIN attempts trigger self-destruct.
 *
 * @returns A non-negative integer; defaults to `5` when unset or invalid.
 * @remarks Stored in secure storage. A value of `0` disables the attempt counter threshold (policy UI may still gate self-destruct).
 */
export async function getSelfDestructAfterFailedAttempts(): Promise<number> {
  const raw = await secureGetItem(POLICY_KEY);
  if (!raw) return DEFAULT_SELF_DESTRUCT_AFTER;
  try {
    const parsed = JSON.parse(raw) as Partial<AuthPolicy>;
    const n = Number(parsed.selfDestructAfterFailedAttempts);
    if (!Number.isFinite(n)) return DEFAULT_SELF_DESTRUCT_AFTER;
    return Math.max(0, Math.floor(n));
  } catch {
    return DEFAULT_SELF_DESTRUCT_AFTER;
  }
}

/**
 * Persists the failed-PIN threshold that triggers self-destruct.
 *
 * @param limit - Desired threshold; floored to a non-negative integer before save.
 * @returns Resolves when the policy is written to secure storage.
 */
export async function setSelfDestructAfterFailedAttempts(limit: number): Promise<void> {
  const normalized = Math.max(0, Math.floor(limit));
  const data: AuthPolicy = { selfDestructAfterFailedAttempts: normalized };
  await secureSetItem(POLICY_KEY, JSON.stringify(data));
}

/**
 * Returns the current count of consecutive failed PIN attempts since last success.
 *
 * @returns A non-negative integer; `0` when unset or corrupt.
 */
export async function getFailedPinAttempts(): Promise<number> {
  const raw = await secureGetItem(FAILED_ATTEMPTS_KEY);
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || Number.isNaN(n) || n < 0) return 0;
  return n;
}

/**
 * Increments the failed PIN attempt counter by one.
 *
 * @returns The new attempt count after increment.
 * @remarks Used with {@link getSelfDestructAfterFailedAttempts} and privacy self-destruct. Call {@link resetFailedPinAttempts} after a successful login.
 */
export async function recordFailedPinAttempt(): Promise<number> {
  const next = (await getFailedPinAttempts()) + 1;
  await secureSetItem(FAILED_ATTEMPTS_KEY, String(next));
  return next;
}

/**
 * Resets the failed PIN attempt counter to zero (e.g. after successful unlock or quick exit).
 *
 * @returns Resolves when secure storage is updated.
 */
export async function resetFailedPinAttempts(): Promise<void> {
  await secureSetItem(FAILED_ATTEMPTS_KEY, "0");
}

/**
 * Removes auth policy and failed-attempt counters from secure storage.
 *
 * @returns Resolves when both keys are cleared.
 * @remarks Typically invoked during {@link runSelfDestruct} or full account wipe—not on ordinary logout unless data is being destroyed.
 */
export async function clearAuthPolicyState(): Promise<void> {
  await secureMultiRemove([POLICY_KEY, FAILED_ATTEMPTS_KEY]);
}
