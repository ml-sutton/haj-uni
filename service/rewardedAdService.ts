import { ADMOB_REWARDED_AD_UNIT_ID } from "@/const/admob";
import Constants from "expo-constants";
import { Platform } from "react-native";
import mobileAds, {
  RewardedAd,
  TestIds,
  type RewardedAdReward,
} from "react-native-google-mobile-ads";

export type RewardedAdUnitIdOptions = {
  unitId?: string;
  fallbackUnitId?: string;
};

/** Google sample banner unit ids — invalid for {@link RewardedAd}. */
const KNOWN_BANNER_TEST_UNIT_IDS = new Set([
  "ca-app-pub-3940256099942544/6300978111",
  "ca-app-pub-3940256099942544/2934735716",
]);

let mobileAdsInitPromise: Promise<void> | null = null;

/**
 * Whether the current platform can show Google Mobile Ads.
 *
 * Rewarded ads require a dev client or release build — not Expo Go or web.
 */
export function isRewardedAdSupported(): boolean {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return false;
  if (Constants.appOwnership === "expo") return false;
  return true;
}

/**
 * Resolves the rewarded ad unit id from environment configuration.
 *
 * Falls back to Google's platform-specific rewarded test unit when unset or
 * when a known banner test id was configured by mistake.
 */
export function getRewardedAdUnitId(
  options: RewardedAdUnitIdOptions = {}
): string {
  const {
    unitId = ADMOB_REWARDED_AD_UNIT_ID,
    fallbackUnitId = TestIds.REWARDED,
  } = options;

  if (!unitId || KNOWN_BANNER_TEST_UNIT_IDS.has(unitId)) {
    return fallbackUnitId;
  }

  return unitId;
}

/** Initializes the Google Mobile Ads SDK once at app launch. */
export function initializeMobileAds(): Promise<void> {
  if (!isRewardedAdSupported()) return Promise.resolve();
  if (!mobileAdsInitPromise) {
    mobileAdsInitPromise = mobileAds()
      .initialize()
      .then(() => undefined);
  }
  return mobileAdsInitPromise;
}

/** Resolves when the Mobile Ads SDK has finished initializing. */
export function whenMobileAdsReady(): Promise<void> {
  return mobileAdsInitPromise ?? initializeMobileAds();
}

/** Creates a rewarded ad instance for the resolved ad unit id. */
export function createRewardedAd(adUnitId = getRewardedAdUnitId()): RewardedAd {
  return RewardedAd.createForAdRequest(adUnitId);
}

export type { RewardedAdReward };
