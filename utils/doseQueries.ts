import type { Dose } from "@/models/dose";
import type { Dosage } from "@/models/dosage";
import type { Medication } from "@/models/medication";

const ACTIVE_BEFORE_MS = 5 * 60 * 1000;
const ACTIVE_AFTER_MS = 10 * 60 * 1000;

export function getDoseActiveWindow(scheduledTime: Date): { startMs: number; endMs: number } {
  const t = scheduledTime.getTime();
  return { startMs: t - ACTIVE_BEFORE_MS, endMs: t + ACTIVE_AFTER_MS };
}

/** A dose is “active” from 5 minutes before scheduled time through 10 minutes after. */
export function isUntakenDoseInActiveWindow(dose: Dose, now: Date = new Date()): boolean {
  if (dose.takenTime != null) return false;
  const { startMs, endMs } = getDoseActiveWindow(new Date(dose.scheduledTime));
  const n = now.getTime();
  return n >= startMs && n <= endMs;
}

export function flattenDosagesFromMedications(medications: Medication[]): Dosage[] {
  return medications.flatMap((m) => m.dosages);
}

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

/** Earliest scheduled time among all untaken doses currently in the active window. */
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
