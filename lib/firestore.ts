import { getFirebaseApp } from "@/lib/firebase";
import { Firestore, getFirestore } from "firebase/firestore";

let firestoreInstance: Firestore | undefined;

/**
 * Returns the singleton Cloud Firestore client bound to the Firebase app.
 *
 * @returns The initialized {@link Firestore} instance.
 *
 * @throws {Error} When Firebase is not configured (via {@link getFirebaseApp}).
 *
 * @example
 * ```ts
 * const db = getFirebaseFirestore();
 * // use with collection(db, "users") ...
 * ```
 */
export function getFirebaseFirestore(): Firestore {
  firestoreInstance ??= getFirestore(getFirebaseApp());
  return firestoreInstance;
}
