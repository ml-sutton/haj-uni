import type { Medication } from "@/models/medication";

/**
 * Whether the user has no remaining units of this medication on hand.
 *
 * @param med - Medication including current {@link Medication.quantity}.
 * @returns `true` when `quantity <= 0`.
 */
export function isMedicationSupplyDepleted(med: Medication): boolean {
  return med.quantity <= 0;
}

/**
 * Filters medications whose supply is depleted.
 *
 * @param medications - Full medication list from the user profile.
 * @returns Subset where {@link isMedicationSupplyDepleted} is true.
 */
export function getDepletedMedications(medications: Medication[]): Medication[] {
  return medications.filter(isMedicationSupplyDepleted);
}

/**
 * Returns an updated medication list after marking one dose as taken.
 *
 * @param medications - Current medications array (not mutated).
 * @param medicationId - ID of the medication containing the dose.
 * @param dosageId - ID of the dosage containing the dose.
 * @param doseId - ID of the dose to mark taken.
 * @returns New array: matching dose gets `takenTime: now`, supply decrements by 1 (floored at 0).
 *
 * @remarks
 * Other medications and doses are shallow-copied unchanged.
 */
export function medicationsAfterDoseTaken(
  medications: Medication[],
  medicationId: string,
  dosageId: string,
  doseId: string
): Medication[] {
  return medications.map((m) => {
    if (m.id !== medicationId) return m;
    return {
      ...m,
      quantity: Math.max(0, m.quantity - 1),
      dosages: m.dosages.map((d) =>
        d.id !== dosageId
          ? d
          : {
              ...d,
              doses: d.doses.map((dose) =>
                dose.id === doseId ? { ...dose, takenTime: new Date() } : dose
              ),
            }
      ),
    };
  });
}

/**
 * Returns an updated medication list after undoing a taken dose.
 *
 * @param medications - Current medications array (not mutated).
 * @param medicationId - ID of the medication containing the dose.
 * @param dosageId - ID of the dosage containing the dose.
 * @param doseId - ID of the dose to mark untaken.
 * @returns New array: matching dose gets `takenTime: null`, supply increments by 1.
 */
export function medicationsAfterDoseUntaken(
  medications: Medication[],
  medicationId: string,
  dosageId: string,
  doseId: string
): Medication[] {
  return medications.map((m) => {
    if (m.id !== medicationId) return m;
    return {
      ...m,
      quantity: m.quantity + 1,
      dosages: m.dosages.map((d) =>
        d.id !== dosageId
          ? d
          : {
              ...d,
              doses: d.doses.map((dose) =>
                dose.id === doseId ? { ...dose, takenTime: null } : dose
              ),
            }
      ),
    };
  });
}
