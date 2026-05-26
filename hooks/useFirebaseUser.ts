import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

export function useFirebaseUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured());

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setUser(null);
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return {
    user,
    loading,
    isSignedIn: user != null,
  };
}
