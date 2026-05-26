import type { Medication } from "@/models/medication";
import {
  isMedicationSupplyDepleted,
  medicationsAfterDoseTaken,
} from "@/utils/medicationSupply";
import { createMedication } from "../helpers/mockUser";

describe("U5 — isMedicationSupplyDepleted (BVA: quantity 0 and 1)", () => {
  it("treats zero or negative quantity as depleted and positive quantity as in stock", () => {
    const inStock = createMedication({ quantity: 1 });
    const empty = createMedication({ quantity: 0 });
    const negative = createMedication({ quantity: -1 });

    expect(isMedicationSupplyDepleted(inStock)).toBe(false);
    expect(isMedicationSupplyDepleted(empty)).toBe(true);
    expect(isMedicationSupplyDepleted(negative)).toBe(true);
  });
});

describe("U6 — medicationsAfterDoseTaken (DTT: dose taken state)", () => {
  it("decrements quantity and records takenTime for the matching dose", () => {
    const med = createMedication({ quantity: 3 });
    const doseId = med.dosages[0].doses[0].id;
    const beforeTaken = med.dosages[0].doses[0].takenTime;

    const updated = medicationsAfterDoseTaken(
      [med],
      med.id,
      med.dosages[0].id,
      doseId
    );

    const updatedMed = updated[0] as Medication;
    const updatedDose = updatedMed.dosages[0].doses.find((d) => d.id === doseId);

    expect(updatedMed.quantity).toBe(2);
    expect(beforeTaken).toBeNull();
    expect(updatedDose?.takenTime).toBeInstanceOf(Date);
  });
});
