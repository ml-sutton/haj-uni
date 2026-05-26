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

export type FirebaseBackupMetadata = {
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

/** Upload local encrypted database to Firestore for the signed-in user. */
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

/** Download encrypted backup from Firestore and restore local storage. */
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

/** Read cloud backup metadata without downloading. */
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
