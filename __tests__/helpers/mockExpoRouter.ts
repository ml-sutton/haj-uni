export const mockExpoRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => mockExpoRouter),
  useNavigation: jest.fn(() => ({
    addListener: jest.fn(() => jest.fn()),
  })),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));
