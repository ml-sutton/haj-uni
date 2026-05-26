# HAJ Test Documentation

This document explains the **15 tests** implemented under `__tests__/`, how to run them, and how each maps to the [Test Plan](./TestPlan.md).

## Running tests

```bash
npm test          # single run
npm run test:watch  # watch mode
```

Configuration lives in `jest.config.js` and `jest.setup.ts` at the project root.

## Installed tooling

| Package | Role |
|---------|------|
| `jest`, `jest-expo` | Test runner aligned with Expo SDK 54 |
| `@testing-library/react-native` | Render components, query by role/label/text, fire events |
| `@types/jest` | TypeScript types for Jest |
| `react-test-renderer` | Peer dependency for React 19 renderer |
| `jest-styled-components` | Snapshot helpers for `styled-components` (wired in setup; UI currently uses React Native `StyleSheet`) |

Shared helpers:

- `__tests__/helpers/renderWithTheme.tsx` — wraps UI in `ThemeProvider` for realistic colours.
- `__tests__/helpers/mockUser.ts` — builds valid `User` / `Medication` fixtures.
- `__tests__/helpers/mockExpoRouter.ts` — central `expo-router` mock for navigation assertions.

---

## Unit tests (`__tests__/unit/`)

### U1 — `geo.test.ts` — zero distance (BVA)

**File:** `__tests__/unit/geo.test.ts`  
**Function:** `distanceMeters`  
**Idea:** Identical latitude/longitude is the minimum sensible input; haversine distance must be exactly zero, not a small floating-point artefact treated as “nearby”.

### U2 — `geo.test.ts` — distance formatting boundary (BVA)

**Function:** `formatDistance`  
**Idea:** Product copy switches at 1 km. **999 m** stays in metres; **1000 m** becomes `"1.0 km"`. Values on either side of the boundary catch off-by-one regressions.

### U3 — `geo.test.ts` — walk duration partitions (EP)

**Function:** `formatDuration`  
**Idea:** Three equivalence classes: under one hour (minutes only), one hour or more with leftover minutes, and exact hours with no remainder.

### U4 — `geo.test.ts` — closest pharmacy (ST)

**Function:** `findClosestPharmacy`  
**Idea:** Start state: user position + unordered pharmacy list. End state: single pharmacy tagged with minimum `distanceMeters`. Ordering of input array must not affect the winner.

### U5 — `medicationSupply.test.ts` — depleted supply (BVA)

**Function:** `isMedicationSupplyDepleted`  
**Idea:** Boundary at `quantity === 0`. Negative quantity is treated as depleted (invalid data should not show “in stock”).

### U6 — `medicationSupply.test.ts` — dose taken (DTT / ST)

**Function:** `medicationsAfterDoseTaken`  
**Idea:** Decision: matching `medicationId`, `dosageId`, and `doseId`. Effects: `quantity - 1` (floored at 0 elsewhere), `takenTime` becomes a `Date`, other doses unchanged.

### U7 — `batteryPolicy.test.ts` — percent display (EP)

**Function:** `formatBatteryPercent`  
**Idea:** Sample fractions across low, threshold-adjacent, and full ranges to ensure rounding to whole percentages.

### U8 — `batteryPolicy.test.ts` — location gate (DTT)

**Function:** `isBatteryTooLowForLocation`  
**Idea:** Decision table with mocked `expo-battery`:

| Battery available | Level | Expected |
|-------------------|-------|----------|
| Yes | &lt; 0.30 | `true` (block location) |
| Yes | ≥ 0.30 | `false` |
| Yes | −1 (unknown) | `false` (fail open) |
| No | — | `false` |

### U9 — `greetings.test.ts` — time-of-day greeting (DTT / EP)

**Function:** `getGreeting`  
**Idea:** `Date.prototype.getHours` is stubbed per partition boundary (11→12, 16→17, 20→21) so tests are deterministic without changing production code.

---

## End-to-end / integration tests (`__tests__/e2e/`)

These run in Jest with mocked native modules. They exercise **user-visible flows** across components and screens rather than isolated pure functions.

### E1 — `getStarted.test.tsx` — onboarding visible (ST)

Renders `GetStarted` and asserts welcome copy and **Dive in** are on screen (initial onboarding state).

### E2 — `getStarted.test.tsx` — register navigation (ST)

Presses **Dive in** and expects `mockExpoRouter.push("/register")` (transition to registration flow).

### E3 — `findPharmaciesButton.test.tsx` — compact map CTA (ST)

Compact variant: accessibility label includes medication name; press builds `/find-pharmacies?...` query string with URL-encoded IDs.

### E4 — `findPharmaciesButton.test.tsx` — supply-out banner (ST)

Full banner: “Supply out for {name}” and 2 km helper text when supply is depleted in the doses UI.

### E5 — `welcome.test.tsx` — home summary (integration)

Renders `Welcome` with a fixture user containing one future untaken dose and one past taken dose → **50% adherence**, next dose **Estradiol**, morning greeting (hour stubbed to 10).

### E6 — `loginScreen.test.tsx` — PIN unlock UI (ST)

Renders `Login` with database, biometrics, and store mocks. After async bootstrap, expects **Welcome back**, PIN hint, hidden `6-digit PIN` input, and **Log in** button—without calling real `login()` or secure storage.

---

## Maintenance notes

- Add new unit tests beside the module they cover in `__tests__/unit/`.
- Add screen flows in `__tests__/e2e/` and extend mocks in `jest.setup.ts` or per-file `jest.mock` as needed.
- If you adopt `styled-components`, `jest-styled-components` is already imported in setup for snapshot style diffs.
- For true on-device E2E later, consider [Maestro](https://maestro.mobile.dev/) or [Detox](https://wix.github.io/Detox/); keep this Jest suite as fast regression coverage.
