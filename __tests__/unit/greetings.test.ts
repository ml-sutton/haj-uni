import { getGreeting, GREETINGS } from "@/const/greetings";

function withHour(hour: number, run: () => void): void {
  const spy = jest.spyOn(Date.prototype, "getHours").mockReturnValue(hour);
  try {
    run();
  } finally {
    spy.mockRestore();
  }
}

describe("U9 — getGreeting (DTT / EP: hour partitions)", () => {
  it.each([
    { hour: 0, expected: GREETINGS[0], partition: "morning" },
    { hour: 11, expected: GREETINGS[0], partition: "morning upper bound" },
    { hour: 12, expected: GREETINGS[1], partition: "afternoon lower bound" },
    { hour: 16, expected: GREETINGS[1], partition: "afternoon upper bound" },
    { hour: 17, expected: GREETINGS[2], partition: "evening lower bound" },
    { hour: 20, expected: GREETINGS[2], partition: "evening upper bound" },
    { hour: 21, expected: GREETINGS[3], partition: "late night" },
    { hour: 23, expected: GREETINGS[3], partition: "late night upper bound" },
  ])("returns $expected for $partition (hour $hour)", ({ hour, expected }) => {
    withHour(hour, () => {
      expect(getGreeting()).toBe(expected);
    });
  });
});
