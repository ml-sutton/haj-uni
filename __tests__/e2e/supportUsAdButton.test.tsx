import AboutScreen from "@/app/(tabs)/settings/about";
import { SupportUsAdButton } from "@/components/SupportUsAdButton";
import { SUPPORT_US_AD_BUTTON_LABEL } from "@/const/admob";
import { useRewardedAd } from "@/hooks/useRewardedAd";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithTheme } from "../helpers/renderWithTheme";

jest.mock("@/hooks/useRewardedAd");

const mockedUseRewardedAd = useRewardedAd as jest.MockedFunction<
  typeof useRewardedAd
>;

describe("E7 — SupportUsAdButton (ST)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the support label when a rewarded ad is ready", () => {
    mockedUseRewardedAd.mockReturnValue({
      supported: true,
      loaded: true,
      loading: false,
      error: null,
      show: jest.fn(),
      retry: jest.fn(),
    });

    renderWithTheme(<SupportUsAdButton />);

    expect(screen.getByText(SUPPORT_US_AD_BUTTON_LABEL)).toBeOnTheScreen();
  });

  it("hides the button on unsupported platforms", () => {
    mockedUseRewardedAd.mockReturnValue({
      supported: false,
      loaded: false,
      loading: false,
      error: null,
      show: jest.fn(),
      retry: jest.fn(),
    });

    renderWithTheme(<SupportUsAdButton />);

    expect(screen.queryByText(SUPPORT_US_AD_BUTTON_LABEL)).toBeNull();
  });
});

describe("E8 — SupportUsAdButton press shows rewarded ad (ST)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls show when the user presses the ready button", () => {
    const show = jest.fn();
    mockedUseRewardedAd.mockReturnValue({
      supported: true,
      loaded: true,
      loading: false,
      error: null,
      show,
      retry: jest.fn(),
    });

    renderWithTheme(<SupportUsAdButton />);
    fireEvent.press(screen.getByLabelText(SUPPORT_US_AD_BUTTON_LABEL));

    expect(show).toHaveBeenCalledTimes(1);
  });

  it("does not call show while the ad is still loading", () => {
    const show = jest.fn();
    mockedUseRewardedAd.mockReturnValue({
      supported: true,
      loaded: false,
      loading: true,
      error: null,
      show,
      retry: jest.fn(),
    });

    renderWithTheme(<SupportUsAdButton />);
    const button = screen.getByLabelText(SUPPORT_US_AD_BUTTON_LABEL);
    fireEvent.press(button);

    expect(show).not.toHaveBeenCalled();
  });
});

describe("E9 — About screen includes support ad button (integration / ST)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRewardedAd.mockReturnValue({
      supported: true,
      loaded: true,
      loading: false,
      error: null,
      show: jest.fn(),
      retry: jest.fn(),
    });
  });

  it("shows the rewarded-ad support button below the about copy", () => {
    renderWithTheme(<AboutScreen />);

    expect(screen.getByText("About")).toBeOnTheScreen();
    expect(screen.getByText(SUPPORT_US_AD_BUTTON_LABEL)).toBeOnTheScreen();
  });
});
