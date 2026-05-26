import AsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { Platform } from "react-native";

/** Firebase web app configuration sourced from Expo public environment variables. */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
};

/**
 * Whether the minimum Firebase client configuration is present in the environment.
 *
 * @returns `true` when `apiKey`, `authDomain`, `projectId`, and `appId` are all non-empty.
 *
 * @remarks
 * Optional fields such as `storageBucket` are not required for auth or Firestore.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

let appInstance: FirebaseApp | undefined;

/**
 * Returns the singleton Firebase app, initializing it on first use.
 *
 * @returns The initialized {@link FirebaseApp}.
 *
 * @throws {Error} When Firebase is not configured (see {@link isFirebaseConfigured}).
 *
 * @remarks
 * Reuses an existing app if `getApps()` already has entries (e.g. hot reload).
 */
export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_API_KEY, EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, EXPO_PUBLIC_FIREBASE_PROJECT_ID, and EXPO_PUBLIC_FIREBASE_APP_ID to your environment."
    );
  }
  appInstance ??= initializeApp(firebaseConfig);
  return appInstance;
}

let authInstance: Auth | undefined;

/**
 * Returns the singleton Firebase Auth instance for the current platform.
 *
 * @returns {@link Auth} with React Native persistence on iOS/Android, or default web auth on web.
 *
 * @throws {Error} When Firebase is not configured (via {@link getFirebaseApp}).
 *
 * @remarks
 * On native, prefers `initializeAuth` with AsyncStorage persistence; falls back to `getAuth`
 * if auth was already initialized (e.g. during fast refresh).
 */
export function getFirebaseAuth(): Auth {
  if (authInstance) {
    return authInstance;
  }
  const app = getFirebaseApp();
  if (Platform.OS === "web") {
    authInstance = getAuth(app);
    return authInstance;
  }
  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    authInstance = getAuth(app);
  }
  return authInstance;
}
