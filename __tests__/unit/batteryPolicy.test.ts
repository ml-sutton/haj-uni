import * as Battery from "expo-battery";
import {
  formatBatteryPercent,
  isBatteryTooLowForLocation,
  MIN_BATTERY_FRACTION_FOR_LOCATION,
} from "@/utils/batteryPolicy";

jest.mock("expo-battery");

const mockedBattery = Battery as jest.Mocked<typeof Battery>;

describe("U7 — formatBatteryPercent (EP: representative fractions)", () => {
  it("rounds fractional levels to whole-number percentages", () => {
    expect(formatBatteryPercent(0)).toBe("0%");
    expect(formatBatteryPercent(0.299)).toBe("30%");
    expect(formatBatteryPercent(1)).toBe("100%");
  });
});

describe("U8 — isBatteryTooLowForLocation (DTT)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedBattery.isAvailableAsync.mockResolvedValue(true);
  });

  it.each([
    { level: MIN_BATTERY_FRACTION_FOR_LOCATION - 0.01, expected: true, label: "below threshold" },
    { level: MIN_BATTERY_FRACTION_FOR_LOCATION, expected: false, label: "at threshold" },
    { level: 0.8, expected: false, label: "well above threshold" },
    { level: -1, expected: false, label: "unknown level" },
  ])("returns $expected when battery is $label", async ({ level, expected }) => {
    mockedBattery.getBatteryLevelAsync.mockResolvedValue(level);
    await expect(isBatteryTooLowForLocation()).resolves.toBe(expected);
  });

  it("returns false when battery API is unavailable", async () => {
    mockedBattery.isAvailableAsync.mockResolvedValue(false);
    await expect(isBatteryTooLowForLocation()).resolves.toBe(false);
  });
});
