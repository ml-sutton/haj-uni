import { getFirebaseApp } from "@/lib/firebase";
import { Firestore, getFirestore } from "firebase/firestore";

let firestoreInstance: Firestore | undefined;

export function getFirebaseFirestore(): Firestore {
  firestoreInstance ??= getFirestore(getFirebaseApp());
  return firestoreInstance;
}
