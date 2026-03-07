import { useTheme } from "@/contexts/theme";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BlueLineart from "@/assets/images/blue-lineart.svg";
import PinkLineart from "@/assets/images/pink-lineart.svg";

const TITLE_BAR_HEIGHT = 56;
const ICON_SCALE = 0.4; // scaled down 20% twice
const ICON_WIDTH = 72 * ICON_SCALE;
const ICON_HEIGHT = 76 * ICON_SCALE;
const ICON_BORDER_RADIUS = 6; // ~2rem
const ROUTE_TEXT_PADDING_LEFT = 16; // ~2rem

const DARK_GRADIENT = ["#6495ed", "#73c2fb"] as const;
const LIGHT_GRADIENT = ["#FFA4B6", "#F19CBB"] as const;
const DARK_ICON_BORDER = "#f19cbb";
const LIGHT_ICON_BORDER = "#7fbfe9";

function getTitleFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last || last === "(tabs)") return "HAJ";
  const label =
    last.charAt(0).toUpperCase() + last.slice(1).toLowerCase();
  return `HAJ | ${label}`;
}

export function TitleBar() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();

  const colors = useMemo(
    () => (theme === "dark" ? DARK_GRADIENT : LIGHT_GRADIENT),
    [theme]
  );

  const LineartSvg = useMemo(
    () => (theme === "dark" ? PinkLineart : BlueLineart),
    [theme]
  );

  const title = useMemo(
    () => getTitleFromPathname(pathname),
    [pathname]
  );

  const titleColor = theme === "dark" ? "#fff" : "#1a1a1a";
  const iconBorderColor =
    theme === "dark" ? DARK_ICON_BORDER : LIGHT_ICON_BORDER;

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.gradient, { height: insets.top + TITLE_BAR_HEIGHT }]}
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
          onPress={() => router.replace("/(tabs)")}
          onLongPress={() => {
            if (Platform.OS === "android") {
              BackHandler.exitApp();
            }
            if (Platform.OS === "ios") {
              throw new Error("Panic: user-initiated crash");
            }
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
