import {
  createRewardedAd,
  isRewardedAdSupported,
  whenMobileAdsReady,
} from "@/service/rewardedAdService";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AdEventType,
  RewardedAdEventType,
  type RewardedAdReward,
} from "react-native-google-mobile-ads";

export type UseRewardedAdOptions = {
  onRewardEarned?: (reward: RewardedAdReward) => void;
};

export type UseRewardedAdResult = {
  supported: boolean;
  loaded: boolean;
  loading: boolean;
  error: string | null;
  show: () => void;
  retry: () => void;
};

/**
 * Loads a rewarded ad in the background and exposes a `show` handler for opt-in playback.
 */
export function useRewardedAd(
  options: UseRewardedAdOptions = {}
): UseRewardedAdResult {
  const { onRewardEarned } = options;
  const supported = isRewardedAdSupported();
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(supported);
  const [error, setError] = useState<string | null>(null);
  const rewardedRef = useRef(createRewardedAd());
  const onRewardEarnedRef = useRef(onRewardEarned);

  useEffect(() => {
    onRewardEarnedRef.current = onRewardEarned;
  }, [onRewardEarned]);

  const loadAd = useCallback(() => {
    if (!supported) return;
    setLoaded(false);
    setLoading(true);
    setError(null);
    rewardedRef.current.load();
  }, [supported]);

  useEffect(() => {
    if (!supported) return;

    const rewarded = rewardedRef.current;
    const unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setLoaded(true);
        setLoading(false);
        setError(null);
      }
    );
    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        onRewardEarnedRef.current?.(reward);
      }
    );
    const unsubscribeError = rewarded.addAdEventListener(
      AdEventType.ERROR,
      (adError) => {
        setLoaded(false);
        setLoading(false);
        setError(adError.message || "Failed to load ad");
      }
    );
    const unsubscribeClosed = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setLoaded(false);
        loadAd();
      }
    );

    void whenMobileAdsReady().then(loadAd);

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeError();
      unsubscribeClosed();
    };
  }, [loadAd, supported]);

  const show = useCallback(() => {
    if (!supported || !rewardedRef.current.loaded) return;
    setLoaded(false);
    rewardedRef.current.show();
  }, [supported]);

  const retry = useCallback(() => {
    loadAd();
  }, [loadAd]);

  return { supported, loaded, loading, error, show, retry };
}
