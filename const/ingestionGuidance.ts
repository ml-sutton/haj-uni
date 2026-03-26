import type { IngestionMethod } from "@/models/dosage";

/** General reminders only — not a substitute for your prescriber or medication leaflet. */
export function getIngestionGuidance(method: IngestionMethod): {
  headline: string;
  steps: string[];
} {
  switch (method) {
    case "Oral":
      return {
        headline: "Taking it by mouth",
        steps: [
          "Wash your hands if needed.",
          "Take the amount on your schedule with a full glass of water unless your clinician told you otherwise.",
          "If you were told to take it with food, a snack, or on an empty stomach, follow that timing.",
          "Sit or stand upright while swallowing if that is easier for you.",
        ],
      };
    case "Gel":
      return {
        headline: "Applying gel",
        steps: [
          "Wash and dry the application area unless your product says otherwise.",
          "Measure or dispense the prescribed amount.",
          "Spread evenly on the recommended body area; avoid broken skin unless instructed.",
          "Let it absorb and dry before dressing; wash hands thoroughly afterward.",
          "Avoid touching others (especially children) with the treated area until dry.",
        ],
      };
    case "Patch":
      return {
        headline: "Using a patch",
        steps: [
          "Choose a clean, dry, mostly hair-free site (often upper arm, hip, or buttock — use what your label says).",
          "Remove the backing and press the patch firmly for several seconds so it sticks well.",
          "Rotate sites so you do not reuse the exact same spot each time.",
          "Note when you applied it and when to replace it per your instructions.",
        ],
      };
    case "Subcutaneous injection":
      return {
        headline: "Subcutaneous (under-the-skin) injection",
        steps: [
          "Gather supplies and check the medication appearance and expiry if applicable.",
          "Wash hands; clean the injection site with an alcohol swab and let it dry.",
          "Pinch a fold of skin if your technique calls for it; insert the needle at the angle you were taught (often 45–90°).",
          "Inject slowly, wait a moment, withdraw, and apply light pressure with gauze if needed.",
          "Dispose of sharps in a proper container.",
        ],
      };
    case "Intramuscular injection":
      return {
        headline: "Intramuscular injection",
        steps: [
          "Use the needle length and injection site your clinician demonstrated (e.g. thigh, gluteal, deltoid).",
          "Wash hands; swab the site and let it dry.",
          "Insert at the correct depth and angle for that muscle; aspirate only if you were trained to do so.",
          "Inject steadily, withdraw, apply pressure; rotate sites across doses if advised.",
          "Dispose of sharps safely.",
        ],
      };
    case "Other":
      return {
        headline: "Taking your medication",
        steps: [
          "Follow the directions on your prescription label and any leaflet from your pharmacy.",
          "If anything is unclear, contact your clinician or pharmacist before taking the dose.",
        ],
      };
  }
}
