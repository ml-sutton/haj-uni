import { SUPPORT_US_AD_BUTTON_LABEL } from "@/const/admob";
import { PRIMARY_BUTTON_BG } from "@/contexts/theme";
import { useRewardedAd } from "@/hooks/useRewardedAd";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

/**
 * Props for {@link SupportUsAdButton}.
 */
export type SupportUsAdButtonProps = {
  /**
   * @param onRewardEarned - Optional callback when the user completes the rewarded ad.
   */
  onRewardEarned?: () => void;
};

/**
 * Opt-in button that plays a rewarded AdMob ad when pressed.
 *
 * Hidden on unsupported platforms (web, Expo Go). Shows a retry affordance when loading fails.
 */
export function SupportUsAdButton({
  onRewardEarned,
}: SupportUsAdButtonProps): React.ReactElement | null {
  const { supported, loaded, loading, error, show, retry } = useRewardedAd({
    onRewardEarned: onRewardEarned
      ? () => {
          onRewardEarned();
        }
      : undefined,
  });

  if (!supported) return null;

  const canShowAd = loaded && !loading;
  const canRetry = Boolean(error) && !loading;
  const disabled = !canShowAd && !canRetry;

  const handlePress = () => {
    if (canShowAd) {
      show();
      return;
    }
    if (canRetry) {
      retry();
    }
  };

  const label = error
    ? "Ad unavailable — tap to retry"
    : SUPPORT_US_AD_BUTTON_LABEL;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 24,
    backgroundColor: PRIMARY_BUTTON_BG,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
