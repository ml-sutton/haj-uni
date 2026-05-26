import { ThemeProvider } from "@/contexts/theme";
import { render, type RenderOptions } from "@testing-library/react-native";
import type { ReactElement, ReactNode } from "react";

/** Wraps children in {@link ThemeProvider} with a fixed light theme for tests. */
function AllProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider initialTheme="light">{children}</ThemeProvider>;
}

/**
 * Renders a React Native tree with the app theme context applied.
 *
 * @param ui - Element under test.
 * @param options - Passed through to Testing Library `render` (wrapper is overridden).
 * @returns Testing Library render result (queries, rerender, unmount, etc.).
 */
export function renderWithTheme(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}
