import { Linking, Platform } from "react-native";

/** Opens the system maps app with turn-by-turn directions to a destination. */
export async function openMapsDirections(
  latitude: number,
  longitude: number,
  label?: string
): Promise<void> {
  const name = label ? encodeURIComponent(label) : undefined;
  const url = Platform.select({
    ios: `maps://?daddr=${latitude},${longitude}&dirflg=w`,
    android: `google.navigation:q=${latitude},${longitude}&mode=w`,
    default:
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}` +
      (name ? `&destination_place_id=${name}` : "") +
      "&travelmode=walking",
  });

  if (!url) return;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
    return;
  }

  const web = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;
  await Linking.openURL(web);
}
