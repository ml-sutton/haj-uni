import {
  distanceMeters,
  findClosestPharmacy,
  formatDistance,
  formatDuration,
} from "@/utils/geo";

describe("U1 — distanceMeters (BVA: identical points)", () => {
  it("returns zero metres when both coordinates are the same", () => {
    const point = { latitude: 51.5074, longitude: -0.1278 };
    expect(distanceMeters(point, point)).toBe(0);
  });
});

describe("U2 — formatDistance (BVA: 999 m vs 1000 m boundary)", () => {
  it("formats sub-kilometre distances in metres and kilometre distances with one decimal", () => {
    expect(formatDistance(999)).toBe("999 m");
    expect(formatDistance(1000)).toBe("1.0 km");
  });
});

describe("U3 — formatDuration (EP: short vs long walks)", () => {
  it("uses minutes below one hour and hours plus minutes at or above one hour", () => {
    expect(formatDuration(30 * 60)).toBe("30 min walk");
    expect(formatDuration(90 * 60)).toBe("1 hr 30 min walk");
    expect(formatDuration(120 * 60)).toBe("2 hr walk");
  });
});

describe("U4 — findClosestPharmacy (ST: select nearest)", () => {
  it("returns the pharmacy with the smallest great-circle distance", () => {
    const origin = { latitude: 51.5, longitude: -0.12 };
    const near = {
      id: "near",
      name: "Near Chemist",
      latitude: 51.501,
      longitude: -0.121,
    };
    const far = {
      id: "far",
      name: "Far Chemist",
      latitude: 51.6,
      longitude: -0.2,
    };
    const result = findClosestPharmacy(origin, [far, near]);
    expect(result?.id).toBe("near");
    expect(result?.distanceMeters).toBeGreaterThan(0);
  });
});
