import GetStarted from "@/app/getStarted";
import { fireEvent, screen } from "@testing-library/react-native";
import { mockExpoRouter } from "../helpers/mockExpoRouter";
import { renderWithTheme } from "../helpers/renderWithTheme";

describe("E1 — GetStarted screen (ST: initial state)", () => {
  it("shows onboarding title and call-to-action", () => {
    renderWithTheme(<GetStarted />);

    expect(screen.getByText("Welcome to Haj!")).toBeOnTheScreen();
    expect(
      screen.getByText("Are you ready to enter the world of cool shark facts?")
    ).toBeOnTheScreen();
    expect(screen.getByText("Dive in")).toBeOnTheScreen();
  });
});

describe("E2 — GetStarted navigation (user flow)", () => {
  it("navigates to registration when Dive in is pressed", () => {
    mockExpoRouter.push.mockClear();
    renderWithTheme(<GetStarted />);
    fireEvent.press(screen.getByText("Dive in"));

    expect(mockExpoRouter.push).toHaveBeenCalledWith("/register");
  });
});
