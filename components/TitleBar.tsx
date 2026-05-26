import { performQuickExitWithPanic } from "@/service/privacyService";
import {
  getGradientColors,
  primaryTextColor,
  tabBarBorderColor,
  titleBarIconBorderColor,
  useTheme,
} from "@/contexts/theme";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter, useSegments } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BlueLineart from "@/assets/images/blue-lineart.svg";
import PinkLineart from "@/assets/images/pink-lineart.svg";

const TITLE_BAR_HEIGHT = 56;
const ICON_SCALE = 0.4; // scaled down 20% twice
const ICON_WIDTH = 72 * ICON_SCALE;
const ICON_HEIGHT = 76 * ICON_SCALE;
const ICON_BORDER_RADIUS = 6; // ~2rem
const ROUTE_TEXT_PADDING_LEFT = 16; // ~2rem
const TITLE_DARK_GRADIENT = ["#6495ed", "#73c2fb"] as const;
const TITLE_LIGHT_GRADIENT = ["#FFA4B6", "#F19CBB"] as const;

function getTitleFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last || last === "(tabs)") return "HAJ";
  const label =
    last.charAt(0).toUpperCase() + last.slice(1).toLowerCase();
  return `HAJ | ${label}`;
}

export interface TitleBarProps {
  /** Override title (e.g. "HAJ | Registration"). When not set, derived from pathname. */
  title?: string;
}

export function TitleBar({ title: titleOverride }: TitleBarProps = {}) {
  const { theme, resolvedTheme, highContrast } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const segments = useSegments();
  const router = useRouter();
  const isInsideTabs = (segments as string[]).includes("(tabs)");

  const colors = useMemo(
    () =>
      highContrast
        ? resolvedTheme === "dark"
          ? (["#000000", "#000000"] as const)
          : (["#ffffff", "#ffffff"] as const)
        : theme === "colonthree"
          ? getGradientColors(resolvedTheme, { themeMode: theme, highContrast })
          : resolvedTheme === "dark"
            ? TITLE_DARK_GRADIENT
            : TITLE_LIGHT_GRADIENT,
    [theme, resolvedTheme, highContrast]
  );

  const LineartSvg = useMemo(
    () =>
      theme === "colonthree"
        ? PinkLineart
        : resolvedTheme === "dark"
          ? PinkLineart
          : BlueLineart,
    [theme, resolvedTheme]
  );

  const title = useMemo(
    () => titleOverride ?? getTitleFromPathname(pathname),
    [pathname, titleOverride]
  );

  const titleColor = primaryTextColor(resolvedTheme, { themeMode: theme, highContrast });
  const iconBorderColor = titleBarIconBorderColor(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });
  const bottomBorderColor = tabBarBorderColor(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.gradient,
        {
          height: insets.top + TITLE_BAR_HEIGHT,
          borderBottomColor: bottomBorderColor,
          borderBottomWidth: highContrast ? 2 : 0,
        },
      ]}
    >
      <View
        style={[
          styles.barContent,
          { top: insets.top, height: TITLE_BAR_HEIGHT },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.iconWrapper,
            styles.iconBorder,
            {
              borderColor: iconBorderColor,
              borderRadius: ICON_BORDER_RADIUS,
              opacity: pressed ? 0.6 : 1,
              backgroundColor: pressed ? "rgba(0,0,0,0.1)" : "transparent",
            },
          ]}
          onPress={() => {
            if (!isInsideTabs) return;
            router.replace("/(tabs)");
          }}
          onLongPress={() => {
            void performQuickExitWithPanic(() => router.replace("/login"));
          }}
        >
          <LineartSvg
            width={ICON_WIDTH}
            height={ICON_HEIGHT}
            style={styles.svg}
          />
        </Pressable>
        <Text
          style={[
            styles.titleText,
            { color: titleColor, paddingLeft: ROUTE_TEXT_PADDING_LEFT },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    height: TITLE_BAR_HEIGHT,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  barContent: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  iconWrapper: {
    width: ICON_WIDTH + 24,
    minHeight: ICON_HEIGHT + 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  iconBorder: {
    borderWidth: 2,
    marginLeft: 8,
  },
  svg: {},
  titleText: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
  },
});
