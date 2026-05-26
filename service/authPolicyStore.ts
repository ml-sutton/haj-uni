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

export async function setSelfDestructAfterFailedAttempts(limit: number): Promise<void> {
  const normalized = Math.max(0, Math.floor(limit));
  const data: AuthPolicy = { selfDestructAfterFailedAttempts: normalized };
  await secureSetItem(POLICY_KEY, JSON.stringify(data));
}

export async function getFailedPinAttempts(): Promise<number> {
  const raw = await secureGetItem(FAILED_ATTEMPTS_KEY);
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || Number.isNaN(n) || n < 0) return 0;
  return n;
}

export async function recordFailedPinAttempt(): Promise<number> {
  const next = (await getFailedPinAttempts()) + 1;
  await secureSetItem(FAILED_ATTEMPTS_KEY, String(next));
  return next;
}

export async function resetFailedPinAttempts(): Promise<void> {
  await secureSetItem(FAILED_ATTEMPTS_KEY, "0");
}

export async function clearAuthPolicyState(): Promise<void> {
  await secureMultiRemove([POLICY_KEY, FAILED_ATTEMPTS_KEY]);
}
