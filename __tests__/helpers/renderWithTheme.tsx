import { ThemeProvider } from "@/contexts/theme";
import { render, type RenderOptions } from "@testing-library/react-native";
import type { ReactElement, ReactNode } from "react";

function AllProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider initialTheme="light">{children}</ThemeProvider>;
}

export function renderWithTheme(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}
