import {
  getRewardedAdUnitId,
  isRewardedAdSupported,
} from "@/service/rewardedAdService";
import Constants from "expo-constants";
import { Platform } from "react-native";

describe("U10 — getRewardedAdUnitId (EP)", () => {
  const rewardedTestUnitId = "ca-app-pub-3940256099942544/5224354917";

  it("returns the configured rewarded ad unit id from env", () => {
    expect(
      getRewardedAdUnitId({
        unitId: rewardedTestUnitId,
        fallbackUnitId: rewardedTestUnitId,
      })
    ).toBe(rewardedTestUnitId);
  });

  it("falls back when ad unit id is unset", () => {
    expect(
      getRewardedAdUnitId({
        unitId: "",
        fallbackUnitId: rewardedTestUnitId,
      })
    ).toBe(rewardedTestUnitId);
  });

  it("falls back when a banner test unit id was configured", () => {
    expect(
      getRewardedAdUnitId({
        unitId: "ca-app-pub-3940256099942544/6300978111",
        fallbackUnitId: rewardedTestUnitId,
      })
    ).toBe(rewardedTestUnitId);
  });
});

describe("U11 — isRewardedAdSupported (EP)", () => {
  const originalOs = Platform.OS;
  const originalOwnership = Constants.appOwnership;

  afterEach(() => {
    Object.defineProperty(Platform, "OS", { value: originalOs });
    Object.defineProperty(Constants, "appOwnership", {
      value: originalOwnership,
    });
  });

  it.each([
    { os: "ios", ownership: null, expected: true },
    { os: "android", ownership: null, expected: true },
    { os: "web", ownership: null, expected: false },
    { os: "android", ownership: "expo", expected: false },
  ])(
    "returns $expected on $os with ownership $ownership",
    ({ os, ownership, expected }) => {
      Object.defineProperty(Platform, "OS", { value: os });
      Object.defineProperty(Constants, "appOwnership", { value: ownership });
      expect(isRewardedAdSupported()).toBe(expected);
    }
  );
});
