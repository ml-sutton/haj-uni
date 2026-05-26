import Login from "@/app/login";
import { screen, waitFor } from "@testing-library/react-native";
import { renderWithTheme } from "../helpers/renderWithTheme";

jest.mock("@/database/database", () => ({
  hasRecoveryEnabled: jest.fn().mockResolvedValue(false),
  login: jest.fn(),
  readEncryptedDBObject: jest.fn(),
  readSafeDBObject: jest.fn().mockResolvedValue({
    biometricEnabled: false,
    selfDestructEnabled: false,
  }),
}));

jest.mock("@/service/biometricKeyStore", () => ({
  getBiometricUnlockLabel: jest.fn().mockResolvedValue("Face ID"),
  getEncryptionKeyWithBiometrics: jest.fn(),
  isBiometricUnlockAvailable: jest.fn().mockResolvedValue(false),
  isNativeBiometricPlatform: jest.fn().mockReturnValue(false),
  refreshBiometricEncryptionKeyIfEnabled: jest.fn(),
  removeStoredEncryptionKey: jest.fn(),
}));

jest.mock("@/service/authPolicyStore", () => ({
  getSelfDestructAfterFailedAttempts: jest.fn().mockResolvedValue(5),
  recordFailedPinAttempt: jest.fn(),
  resetFailedPinAttempts: jest.fn(),
  setSelfDestructAfterFailedAttempts: jest.fn(),
}));

jest.mock("@/stores/databaseStore", () => ({
  useDatabaseStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      setEncryptionKey: jest.fn(),
      setUser: jest.fn(),
      setIsAuthed: jest.fn(),
      clearAuth: jest.fn(),
    }),
}));

describe("E6 — Login screen (ST: unlock entry point)", () => {
  it("renders PIN unlock UI after bootstrap", async () => {
    renderWithTheme(<Login />);

    await waitFor(() => {
      expect(screen.getByText("Welcome back")).toBeOnTheScreen();
    });

    expect(screen.getByText("Enter your PIN to continue")).toBeOnTheScreen();
    expect(screen.getByLabelText("6-digit PIN")).toBeOnTheScreen();
    expect(screen.getByText("Log in")).toBeOnTheScreen();
  });
});
