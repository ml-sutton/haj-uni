# Haj

**Haj** is a privacy-focused mobile application for tracking **hormone replacement therapy (HRT)** doses, medications, and personal notes. This repository (`haj-uni`) is the university / portfolio implementation built with Expo and React Native.

> *This project is a **portfolio piece** and is **not intended for real-world medical use.** See the [disclaimer](#disclaimer) below.*

Related project home: [haj-app/haj on Codeberg](https://codeberg.org/haj-app/haj).

---

## Overview

Haj helps users manage HRT regimens with features built around **security, usability, and accessibility**. Data stays on the device by default, encrypted with keys derived from a PIN. Optional **Firebase** sign-in uploads only an **encrypted backup blob**—never plaintext health data.

---

## Features

### Dose & medication tracking

- **Medications & dosages** — Track multiple medications with ingestion method, units, schedules, and time-of-day slots.
- **Dose log** — Schedule doses, mark taken/untaken, and view upcoming doses on the home calendar.
- **Active dose flow** — Dedicated screen when a dose is due in its reminder window.
- **Supply tracking** — Quantity decreases when doses are taken; low-supply prompts and **find pharmacies** (nearby map + walking directions when location APIs are configured).
- **Dosage defaults** — Configure how many future doses to generate per new dosage; one-off doses via long-press save.
- **Ingestion guidance** — Educational copy per route (oral, sublingual, etc.); not medical advice.

### Reminders & notes

- **Push notifications** — Dose reminders via Expo Notifications (respects master notification toggle).
- **Discrete notifications** — Neutral “shark facts” style copy on the lock screen when discrete mode is on.
- **Notes** — Encrypted in-app notepad linked from the home tab.

### Security & privacy

- **Encrypted local database** — User profile, medications, and notes stored in an AES-encrypted partition; theme and privacy toggles in a separate safe store.
- **PIN login** — Key derivation (salt + iterated SHA-256) and master-key wrapping; PIN change without re-encrypting all data.
- **BIP39 recovery** — 24-word mnemonic to recover access and set a new PIN; optional recovery verification timestamp.
- **Biometric unlock** — Optional device biometrics to unlock the encryption key (native platforms).
- **Quick exit** — Save state, clear session, return to login; optional gyroscopic “panic” gesture to hide the app quickly.
- **Discrete mode** — Reduces sensitive wording in UI and notifications.
- **Self-destruct** — After configurable failed PIN attempts, wipe local data (when enabled).
- **Silent mode** — Tone down non-critical feedback.
- **Encrypted export** — Share an encrypted backup JSON from the danger zone; import supported for restore/migration.

### Optional cloud backup

- **Firebase Auth + Firestore** — Sign in from Settings to upload or download **encrypted** backups only (see [Firebase setup](#firebase--firestore-optional)).
- **Local-first** — The app is fully usable without Firebase; cloud sync is opt-in.

### Appearance & accessibility

- **Themes** — Light, dark, system, and high-contrast variants.
- **Accessibility** — High-contrast UI options in appearance settings.

### Planned / stub

- **Blood level monitoring** — The **Levels** tab is a placeholder; charts and level history are not implemented yet.

---

## Tech stack

| Area | Choice |
|------|--------|
| **Framework** | [Expo](https://expo.dev) (~54) with [Expo Router](https://docs.expo.dev/router/introduction/) |
| **Language** | TypeScript |
| **UI** | React Native |
| **State** | [Zustand](https://github.com/pmndrs/zustand) (`databaseStore`, `safePreferencesStore`) + periodic DB sync |
| **Validation** | [Zod](https://zod.dev) models |
| **Notifications** | `expo-notifications` |
| **Storage** | `expo-secure-store`, AsyncStorage (Firebase auth persistence on native) |
| **Encryption** | AES (CryptoJS + expo-crypto), PIN KDF, BIP39 mnemonic wrap (`@scure/bip39`) |
| **Maps / pharmacies** | `expo-location`, `react-native-maps`, Google/OSRM routing (API keys in `.env`) |
| **Testing** | Jest, React Native Testing Library |
| **Docs** | TypeDoc → GitHub Wiki (on `main`) |

---

## Getting started

### Prerequisites

- **Node.js** ≥ 18 (CI uses 22)
- **pnpm** (see `packageManager` in `package.json`)
- [Expo Go](https://expo.dev/go) or a [development build](https://docs.expo.dev/develop/development-builds/introduction/) for device testing

### Install and run

```bash
git clone https://github.com/ml-sutton/haj-uni.git
cd haj-uni
pnpm install
pnpm start
```

Then open the project in Expo Go, an emulator, or a dev client (`pnpm android` / `pnpm ios` if configured).

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm start` | Start Expo dev server |
| `pnpm run lint` | ESLint (Expo config) |
| `pnpm test` | Jest unit and integration tests |
| `pnpm run docs:wiki` | Generate API Markdown under `build/wiki-docs/` |

---

## Firebase & Firestore (optional)

1. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_FIREBASE_*` from your Firebase web app config.
2. In Firebase Console: enable **Authentication** (Email/Password) and create **Firestore Database**.
3. In **Firestore → Rules**, use [`firestore.rules`](firestore.rules) (no open `/{document=**}` test rule), then **Publish**. Or: `firebase deploy --only firestore:rules`.
4. Restart Expo after changing `.env`. In the app: **Settings → Sync to firebase** to sign in, then upload or download encrypted backups.

For maps and pharmacy routing, set `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` when using Google Directions.

---

## Security & privacy

Haj is designed **secure-by-design**:

- Health data is encrypted at rest; the PIN is never stored.
- Recovery uses a **24-word BIP39** phrase to re-wrap keys, not to store plaintext records in the cloud.
- **Quick exit** and **discrete mode** support safety in shared or coercive environments.
- **Self-destruct** clears local ciphertext, salts, and wrapped keys after repeated failed PINs (when enabled).
- Firebase, if used, stores only **encrypted backup payloads** under the authenticated user—not readable dose content on the server without the user’s keys.

---

## CI

On every pull request and push to `main`, GitHub Actions runs dependency audit, lint, and Jest ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)). Merges to `main` can also run the Android release and wiki publish workflows.

---

## Roadmap

Aligned with the [original Haj roadmap](https://codeberg.org/haj-app/haj/src/branch/main/README.md#), with current status in this repo:

| Phase | Focus | Status in `haj-uni` |
|-------|--------|------------------------|
| **1** | Encrypted DB, PIN, BIP39 recovery, biometrics | Largely implemented |
| **2** | Doses, dosages, reminders, notes | Implemented; **blood levels / graphs** not yet |
| **3** | Quick exit, discrete, self-destruct, silent | Implemented |
| **4** | Reports & analytics | Not started |

---

## Disclaimer

This application is developed **solely as a portfolio / academic project** to demonstrate mobile development and data security practices.

- **Haj is not a medical product.**
- **Do not use it to manage real treatments, dosing, or clinical decisions.**
- Dose schedules, guidance text, and analytics may be **inaccurate or incomplete**.
- The authors are **not liable** for any harm from use or misuse of this software.
- Always consult a **qualified healthcare professional** for medical advice.

---

## Contributing

Contributions and feedback are welcome for learning and improvement:

1. Fork the repository  
2. Create a feature branch  
3. Open a pull request (CI must pass)

API reference for modules is published to the repo **Wiki** when the publish workflow succeeds (requires Wikis enabled and an initial wiki page on GitHub).

---

## License

Haj is intended to be licensed under the **GPL-3.0** (see the [Codeberg Haj project](https://codeberg.org/haj-app/haj)). Add or verify a `LICENSE` file in this repository for the exact grant.

---

## Acknowledgements

Created with respect for the transgender community and a focus on privacy and digital autonomy. Thanks to the open-source tools that make projects like Haj possible—Expo, React Native, Zustand, Firebase, and many others listed in `package.json`.
