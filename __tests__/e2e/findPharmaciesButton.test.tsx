import { FindPharmaciesButton } from "@/components/doses/FindPharmaciesButton";
import { fireEvent, screen } from "@testing-library/react-native";
import { mockExpoRouter } from "../helpers/mockExpoRouter";
import { renderWithTheme } from "../helpers/renderWithTheme";

describe("E3 — FindPharmaciesButton compact mode (ST)", () => {
  it("renders compact CTA and opens pharmacy map with encoded query params", () => {
    mockExpoRouter.push.mockClear();
    renderWithTheme(
      <FindPharmaciesButton
        medicationId="med-abc"
        medicationName="Spironolactone"
        compact
      />
    );

    const button = screen.getByLabelText(
      "Find pharmacies near you for Spironolactone"
    );
    expect(button).toBeOnTheScreen();
    fireEvent.press(button);

    expect(mockExpoRouter.push).toHaveBeenCalledWith(
      "/find-pharmacies?medicationId=med-abc&medicationName=Spironolactone"
    );
  });
});

describe("E4 — FindPharmaciesButton depleted supply banner (ST)", () => {
  it("shows supply-out messaging in full banner mode", () => {
    renderWithTheme(
      <FindPharmaciesButton
        medicationId="med-1"
        medicationName="Estradiol"
      />
    );

    expect(screen.getByText("Supply out for Estradiol")).toBeOnTheScreen();
    expect(
      screen.getByText(
        "See pharmacies within 2 km of your current location."
      )
    ).toBeOnTheScreen();
    expect(screen.getByText("Find nearby pharmacies")).toBeOnTheScreen();
  });
});
