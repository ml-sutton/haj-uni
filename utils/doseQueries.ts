import type { Dose } from "@/models/dose";
import type { Dosage } from "@/models/dosage";
import type { Medication } from "@/models/medication";

/** Milliseconds before scheduled time when a dose becomes “active” (5 minutes). */
const ACTIVE_BEFORE_MS = 5 * 60 * 1000;

/** Milliseconds after scheduled time while a dose remains “active” (10 minutes). */
const ACTIVE_AFTER_MS = 10 * 60 * 1000;

/**
 * Computes the inclusive time window during which an untaken dose is considered active.
 *
 * @param scheduledTime - When the dose is due.
 * @returns `startMs` and `endMs` as Unix epoch milliseconds for use with `Date.getTime()`.
 */
export function getDoseActiveWindow(scheduledTime: Date): { startMs: number; endMs: number } {
  const t = scheduledTime.getTime();
  return { startMs: t - ACTIVE_BEFORE_MS, endMs: t + ACTIVE_AFTER_MS };
}

/**
 * Whether an untaken dose is inside its active window relative to `now`.
 *
 * @param dose - Dose to evaluate; taken doses always return `false`.
 * @param now - Reference instant (defaults to current time).
 * @returns `true` from 5 minutes before scheduled time through 10 minutes after.
 */
export function isUntakenDoseInActiveWindow(dose: Dose, now: Date = new Date()): boolean {
  if (dose.takenTime != null) return false;
  const { startMs, endMs } = getDoseActiveWindow(new Date(dose.scheduledTime));
  const n = now.getTime();
  return n >= startMs && n <= endMs;
}

/**
 * Flattens all dosages from a list of medications into a single array.
 *
 * @param medications - User's medications from the encrypted profile.
 * @returns Every {@link Dosage} across all medications, in medication order.
 */
export function flattenDosagesFromMedications(medications: Medication[]): Dosage[] {
  return medications.flatMap((m) => m.dosages);
}

/**
 * Locates a dose by ID across all medications and dosages.
 *
 * @param medications - Full medication list to search.
 * @param doseId - Target dose identifier.
 * @returns Parent medication, dosage, and dose, or `null` if not found.
 */
export function findDoseById(
  medications: Medication[],
  doseId: string
): { medication: Medication; dosage: Dosage; dose: Dose } | null {
  for (const medication of medications) {
    for (const dosage of medication.dosages) {
      const dose = dosage.doses.find((d) => d.id === doseId);
      if (dose) return { medication, dosage, dose };
    }
  }
  return null;
}

/**
 * Finds the earliest-scheduled untaken dose that is currently in the active window.
 *
 * @param dosages - Dosages to scan (often from {@link flattenDosagesFromMedications}).
 * @param now - Reference instant (defaults to current time).
 * @returns The dosage/dose pair with the soonest `scheduledTime` among active candidates, or `null`.
 */
export function findActiveUntakenDose(
  dosages: Dosage[],
  now: Date = new Date()
): { dosage: Dosage; dose: Dose } | null {
  const candidates: { dosage: Dosage; dose: Dose }[] = [];
  for (const dosage of dosages) {
    for (const dose of dosage.doses) {
      if (!isUntakenDoseInActiveWindow(dose, now)) continue;
      candidates.push({ dosage, dose });
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort(
    (a, b) =>
      new Date(a.dose.scheduledTime).getTime() - new Date(b.dose.scheduledTime).getTime()
  );
  return candidates[0] ?? null;
}
