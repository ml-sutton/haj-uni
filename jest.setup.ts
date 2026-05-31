/**
 * Global Jest setup: Testing Library matchers, styled-components snapshot support,
 * Expo Router mock, and stubs for AsyncStorage, SecureStore, database, and LinearGradient.
 */
import "@testing-library/jest-native/extend-expect";
import "jest-styled-components";
import "./__tests__/helpers/mockExpoRouter";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("@/database/database", () => ({
  readSafeDBObject: jest.fn().mockResolvedValue({
    theme: "system",
    discreteMode: false,
    selfDestructEnabled: false,
    quickExitEnabled: false,
    silentMode: false,
    notificationsEnabled: true,
    biometricEnabled: false,
  }),
  writeSafeDBObject: jest.fn().mockResolvedValue(undefined),
  hasRecoveryEnabled: jest.fn().mockResolvedValue(false),
  login: jest.fn(),
  readEncryptedDBObject: jest.fn(),
}));

jest.mock("expo-linear-gradient", () => {
  const { View } = require("react-native");
  return { LinearGradient: View };
});

jest.mock("expo-constants", () => ({
  appOwnership: null,
}));

jest.mock("react-native-google-mobile-ads", () => {
  const TestIds = {
    REWARDED: process.env.EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID ?? "",
  };
  const RewardedAdEventType = {
    LOADED: "loaded",
    EARNED_REWARD: "earned_reward",
  };

  return {
    __esModule: true,
    default: jest.fn(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
    })),
    TestIds,
    RewardedAdEventType,
    RewardedAd: {
      createForAdRequest: jest.fn(() => ({
        loaded: false,
        load: jest.fn(),
        show: jest.fn(),
        addAdEventListener: jest.fn(() => jest.fn()),
      })),
    },
  };
});
