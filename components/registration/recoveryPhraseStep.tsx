import {
  getGradientColors,
  primaryTextColor,
  PRIMARY_BUTTON_BG,
  useTheme,
} from "@/contexts/theme";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/**
 * Props for {@link RecoveryPhraseStep}.
 */
export interface RecoveryPhraseStepProps {
  /**
   * @param mnemonic - Space-separated 24-word BIP39 recovery phrase to display (may be empty while generating).
   */
  mnemonic: string;
  /**
   * @param acknowledged - Whether the user has confirmed they saved the phrase.
   */
  acknowledged: boolean;
  /**
   * @param onAcknowledgedChange - Called when the acknowledgment checkbox is toggled.
   */
  onAcknowledgedChange: (value: boolean) => void;
}

/**
 * Registration step that displays the recovery mnemonic, copy action, and save confirmation.
 *
 * @param props - Recovery phrase step state and handlers.
 * @returns A scrollable panel with phrase card, copy button, and acknowledgment checkbox.
 */
export function RecoveryPhraseStep({
  mnemonic,
  acknowledged,
  onAcknowledgedChange,
}: RecoveryPhraseStepProps): React.ReactElement {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const gradientColors = getGradientColors(resolvedTheme);
  const titleColor = primaryTextColor(resolvedTheme);
  const bodyColor = isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)";
  const cardBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
  const [copied, setCopied] = useState(false);

  const words = mnemonic ? mnemonic.split(" ") : [];

  const handleCopy = useCallback(async () => {
    if (!mnemonic) return;
    await Clipboard.setStringAsync(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [mnemonic]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={[styles.title, { color: titleColor }]}>
        Save your recovery phrase
      </Text>
      <Text style={[styles.body, { color: bodyColor }]}>
        These 24 words are the only way to recover your encrypted data if you
        forget your PIN. They are not stored on this device in plain text.
        Write them down on paper and store them somewhere safe, or copy them to
        a secure password manager. Anyone with this phrase can access your
        account.
      </Text>

      <View style={[styles.phraseCard, { backgroundColor: cardBg }]}>
        <Text style={[styles.phraseText, { color: titleColor }]}>
          {words.length > 0
            ? words.map((w, i) => `${i + 1}. ${w}`).join("  ")
            : "Generating…"}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.copyButton,
            { backgroundColor: PRIMARY_BUTTON_BG },
            pressed && styles.copyPressed,
            !mnemonic && styles.copyDisabled,
          ]}
          onPress={handleCopy}
          disabled={!mnemonic}
        >
          <Ionicons name="copy-outline" size={20} color="#fff" />
          <Text style={styles.copyLabel}>
            {copied ? "Copied" : "Copy phrase"}
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.checkboxRow}
        onPress={() => onAcknowledgedChange(!acknowledged)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acknowledged }}
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor: gradientColors[0],
              backgroundColor: acknowledged
                ? PRIMARY_BUTTON_BG
                : "transparent",
            },
          ]}
        >
          {acknowledged ? (
            <Ionicons name="checkmark" size={18} color="#fff" />
          ) : null}
        </View>
        <Text style={[styles.checkboxLabel, { color: titleColor }]}>
          I have written down or securely saved my recovery phrase
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  phraseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  phraseText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "500",
    marginBottom: 16,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  copyPressed: { opacity: 0.85 },
  copyDisabled: { opacity: 0.4 },
  copyLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
});
