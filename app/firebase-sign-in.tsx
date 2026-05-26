import {
  getGradientColors,
  inputBackgroundColor,
  inputBorderColor,
  primaryTextColor,
  secondaryTextColor,
  PRIMARY_BUTTON_BG,
  useTheme,
} from "@/contexts/theme";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function FirebaseSignInScreen() {
  const router = useRouter();
  const { user: firebaseUser, loading: authLoading } = useFirebaseUser();
  const { theme, resolvedTheme, highContrast } = useTheme();
  const gradientColors = getGradientColors(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });
  const titleColor = primaryTextColor(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });
  const hintColor = secondaryTextColor(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });
  const inputBg = inputBackgroundColor(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });
  const borderColor = inputBorderColor(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !firebaseUser) return;
    router.replace("/firebase-logged-in" as any);
  }, [authLoading, firebaseUser, router]);

  const handleSignIn = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      setError("Firebase env vars are missing. Set EXPO_PUBLIC_FIREBASE_* in your environment.");
      return;
    }
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError("Enter your Firebase email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(
        auth,
        trimmed,
        password
      );
      void credential.user;
      router.replace("/firebase-logged-in" as any);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Firebase sign-in failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [email, password, router]);

  if (authLoading || firebaseUser) {
    return (
      <LinearGradient
        colors={[...gradientColors]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={titleColor} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[...gradientColors]}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: titleColor }]}>
            Sign in to Firebase
          </Text>
          <Text style={[styles.hint, { color: hintColor }]}>
            Sign in to upload or download your encrypted backup from Firestore.
          </Text>

          <Text style={[styles.label, { color: titleColor }]}>Email</Text>
          <TextInput
            style={[
              styles.input,
              { color: titleColor, backgroundColor: inputBg, borderColor },
            ]}
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            editable={!loading}
            placeholder="you@example.com"
            placeholderTextColor={hintColor}
          />

          <Text style={[styles.label, { color: titleColor }]}>Password</Text>
          <TextInput
            style={[
              styles.input,
              { color: titleColor, backgroundColor: inputBg, borderColor },
            ]}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError(null);
            }}
            secureTextEntry
            textContentType="password"
            autoComplete="password"
            editable={!loading}
            placeholder="••••••••"
            placeholderTextColor={hintColor}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && !loading && styles.primaryPressed,
              loading && styles.primaryDisabled,
            ]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign in with Firebase</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  hint: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    fontSize: 16,
    marginBottom: 16,
  },
  error: {
    color: "#e57373",
    fontSize: 14,
    marginBottom: 16,
  },
  primaryButton: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: PRIMARY_BUTTON_BG,
    alignItems: "center",
  },
  primaryPressed: { opacity: 0.9 },
  primaryDisabled: { opacity: 0.55 },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});
