import type { Medication } from "@/models/medication";

/** True when the user has no remaining units of this medication. */
export function isMedicationSupplyDepleted(med: Medication): boolean {
  return med.quantity <= 0;
}

export function getDepletedMedications(medications: Medication[]): Medication[] {
  return medications.filter(isMedicationSupplyDepleted);
}

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
