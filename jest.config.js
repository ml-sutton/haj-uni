/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/__tests__/helpers/"],
  collectCoverageFrom: [
    "utils/**/*.{ts,tsx}",
    "const/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
  ],
};
