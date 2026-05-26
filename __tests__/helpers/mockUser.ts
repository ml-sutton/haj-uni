import type { Medication } from "@/models/medication";
import type { User } from "@/models/user";

export function createMedication(
  overrides: Partial<Medication> = {}
): Medication {
  const future = new Date(Date.now() + 60 * 60 * 1000);
  const past = new Date(Date.now() - 60 * 60 * 1000);
  return {
    id: "med-1",
    name: "Estradiol",
    ingestionMethod: "Oral",
    medicationType: "Hormone",
    quantity: 10,
    refillAlertOn: false,
    refillAlertQty: 5,
    dosages: [
      {
        id: "dosage-1",
        timesOfDay: [{ hour: 9, minute: 0 }],
        amount: 2,
        unit: "mg",
        frequencyDays: 1,
        notes: null,
        doses: [
          {
            id: "dose-1",
            scheduledTime: future,
            takenTime: null,
          },
          {
            id: "dose-2",
            scheduledTime: past,
            takenTime: past,
          },
        ],
      },
    ],
    ...overrides,
  };
}

export function createUser(overrides: Partial<User> = {}): User {
  return {
    username: "Alex",
    pronouns: ["they/them"],
    medications: [createMedication()],
    preferences: {
      selfDestructAfterFailedAttempts: 5,
      lastRecoveryVerifiedAt: null,
      dosesPerDosage: 7,
    },
    notes: [],
    ...overrides,
  };
}
