/** Rewarded ad unit id from AdMob dashboard (set in `.env`). */
export const ADMOB_REWARDED_AD_UNIT_ID =
  process.env.EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID?.trim() ?? "";

/** Label shown on the rewarded-ad support button. */
export const SUPPORT_US_AD_BUTTON_LABEL = "Support us by viewing an ad";
