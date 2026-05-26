import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

/**
 * Subscribes to Firebase Authentication state for cloud backup sign-in UI.
 *
 * @returns `user` (Firebase `User` or null), `loading` until the first auth event, and `isSignedIn`.
 * @remarks When Firebase is not configured, `loading` becomes false immediately and `user` stays null.
 * @example
 * ```tsx
 * const { user, loading, isSignedIn } = useFirebaseUser();
 * if (loading) return <Spinner />;
 * ```
 */
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
