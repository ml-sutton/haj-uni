import { Welcome } from "@/components/index/Welcome";
import { GREETINGS } from "@/const/greetings";
import { screen } from "@testing-library/react-native";
import { createUser } from "../helpers/mockUser";
import { renderWithTheme } from "../helpers/renderWithTheme";

describe("E5 — Welcome home card (integration / ST)", () => {
  it("greets the user and shows next dose and adherence summary", () => {
    jest.spyOn(Date.prototype, "getHours").mockReturnValue(10);
    const user = createUser({ username: "Sam" });

    renderWithTheme(<Welcome user={user} />);

    expect(
      screen.getByText(
        new RegExp(
          `${GREETINGS[0]}, Sam! Your next dose is of Estradiol and your adherence rate is 50%\\.`
        )
      )
    ).toBeOnTheScreen();
  });
});
