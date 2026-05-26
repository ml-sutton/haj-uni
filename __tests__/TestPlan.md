# HAJ Test Plan

This plan defines **15 tests** for the HAJ (Hormone Administration Journey) Expo app: **9 unit tests** and **6 end-to-end (integration) tests**. Techniques used include **Boundary Value Analysis (BVA)**, **Equivalence Partitioning (EP)**, **Decision Table Testing (DTT)**, and **State Transition (ST)** testing.

| ID | Type | Feature / module | Technique | Objective |
|----|------|------------------|-----------|-----------|
| **U1** | Unit | `utils/geo` — `distanceMeters` | BVA | Verify distance is **0 m** when origin and destination are identical (lower boundary of “same point”). |
| **U2** | Unit | `utils/geo` — `formatDistance` | BVA | At the **999 m / 1000 m** boundary, output switches from metres to kilometres with one decimal place. |
| **U3** | Unit | `utils/geo` — `formatDuration` | EP | **Short walk** partition (&lt; 60 min) vs **long walk** partition (≥ 60 min, with/without remainder minutes). |
| **U4** | Unit | `utils/geo` — `findClosestPharmacy` | ST | From “user at origin” with multiple pharmacies, transition to “nearest selected” with correct `distanceMeters`. |
| **U5** | Unit | `utils/medicationSupply` — `isMedicationSupplyDepleted` | BVA | **Quantity 0** and **negative** (depleted) vs **quantity 1** (in stock). |
| **U6** | Unit | `utils/medicationSupply` — `medicationsAfterDoseTaken` | DTT / ST | When dose is taken: quantity decrements, `takenTime` set; other medications unchanged. |
| **U7** | Unit | `utils/batteryPolicy` — `formatBatteryPercent` | EP | Representative fractions: empty, below threshold display, full charge. |
| **U8** | Unit | `utils/batteryPolicy` — `isBatteryTooLowForLocation` | DTT | Rows: below 30%, at 30%, above 30%, unknown level (−1), API unavailable. |
| **U9** | Unit | `const/greetings` — `getGreeting` | DTT / EP | Hour partitions: morning [0–11], afternoon [12–16], evening [17–20], late night [21–23]. |
| **E1** | E2E | `app/getStarted` | ST | Initial onboarding screen shows title, subtitle, and **Dive in** CTA. |
| **E2** | E2E | `app/getStarted` → register | ST / flow | Pressing **Dive in** triggers navigation to `/register`. |
| **E3** | E2E | `FindPharmaciesButton` (compact) | ST | Compact CTA visible; press navigates to pharmacy map with encoded medication params. |
| **E4** | E2E | `FindPharmaciesButton` (banner) | ST | Depleted-supply banner shows medication name and 2 km copy. |
| **E5** | E2E | `Welcome` home card | Integration / ST | Authenticated home summary shows greeting, username, next dose name, adherence %. |
| **E6** | E2E | `app/login` | ST | Login bootstrap completes; PIN field, hints, and **Log in** affordance are shown. |

## Technique reference

| Abbreviation | Name | How it is applied here |
|--------------|------|-------------------------|
| **BVA** | Boundary Value Analysis | Values at edges of valid ranges (0 m distance, 999/1000 m, quantity 0/1, battery 30% threshold). |
| **EP** | Equivalence Partitioning | Groups of inputs expected to behave alike (short vs long duration, greeting time bands). |
| **DTT** | Decision Table Testing | Combinations of conditions → outcomes (battery level vs “too low”; hour → greeting). |
| **ST** | State Transition | UI or data moves from one state to another (onboarding → register; dose untaken → taken; map navigation). |

## Test environment

- **Runner:** Jest 29 with `jest-expo` preset (Expo SDK 54).
- **Component tests:** `@testing-library/react-native`.
- **Styled output:** `jest-styled-components` is configured for future styled-component snapshots (app UI currently uses `StyleSheet`).
- **Command:** `npm test`

## Out of scope (this plan)

- Live Firebase / Firestore calls.
- Real device GPS, OSRM, or Google Directions APIs.
- Detox / Maestro device farm runs (integration tests simulate user flows in Jest).
