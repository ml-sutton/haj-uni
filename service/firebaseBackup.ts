import {
  getEncryptedDataForExport,
  importEncryptedBackup,
} from "@/database/database";
import { getFirebaseAuth } from "@/lib/firebase";
import { getFirebaseFirestore } from "@/lib/firestore";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from "firebase/firestore";

const BACKUP_DOC_ID = "backup";

/**
 * Metadata about a cloud backup without downloading payload bytes.
 */
export type FirebaseBackupMetadata = {
  /** Last server-reported update time, or `null` if no backup exists. */
  updatedAt: Date | null;
};

function backupDocRef(uid: string) {
  return doc(getFirebaseFirestore(), "users", uid, "backups", BACKUP_DOC_ID);
}

function requireFirebaseUser() {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new Error("Sign in to Firebase before syncing.");
  }
  return user;
}

function timestampToDate(value: Timestamp | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as Timestamp).toDate === "function") {
    return (value as Timestamp).toDate();
  }
  return null;
}

/**
 * Uploads the local encrypted database blob to Firestore for the signed-in user.
 *
 * @returns Resolves when the backup document is written.
 * @throws When Firebase is not configured, the user is signed out, or export/read fails.
 * @remarks **Security:** Only ciphertext is uploaded—the cloud never receives the PIN or raw encryption key. Firebase account compromise still exposes encrypted backup bytes.
 */
export async function uploadFirebaseBackup(): Promise<void> {
  const user = requireFirebaseUser();
  const payload = await getEncryptedDataForExport();
  await setDoc(
    backupDocRef(user.uid),
    {
      payload,
      updatedAt: serverTimestamp(),
      email: user.email ?? null,
    },
    { merge: true }
  );
}

/**
 * Downloads the user's cloud backup and restores local encrypted storage.
 *
 * @returns Metadata including `updatedAt` from the restored document.
 * @throws When not signed in, no backup exists, or payload is missing/invalid.
 * @remarks **Security:** Replaces local encrypted data with cloud copy. Caller must re-unlock with PIN after import if session state was cleared.
 */
export async function downloadFirebaseBackup(): Promise<FirebaseBackupMetadata> {
  const user = requireFirebaseUser();
  const snap = await getDoc(backupDocRef(user.uid));
  if (!snap.exists()) {
    throw new Error("No cloud backup found for this account.");
  }
  const data = snap.data();
  const payload = data.payload;
  if (typeof payload !== "string" || !payload) {
    throw new Error("Cloud backup is empty or invalid.");
  }
  await importEncryptedBackup(payload);
  return {
    updatedAt: timestampToDate(data.updatedAt as Timestamp | undefined),
  };
}

/**
 * Reads cloud backup metadata without downloading or applying the payload.
 *
 * @returns `{ updatedAt: null }` when no backup document exists.
 * @throws When Firebase is not configured or the user is signed out.
 */
export async function getFirebaseBackupMetadata(): Promise<FirebaseBackupMetadata> {
  const user = requireFirebaseUser();
  const snap = await getDoc(backupDocRef(user.uid));
  if (!snap.exists()) {
    return { updatedAt: null };
  }
  return {
    updatedAt: timestampToDate(snap.data().updatedAt as Timestamp | undefined),
  };
}
