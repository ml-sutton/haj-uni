/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  const googleMapsApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.GMAPS_API_KEY?.trim() ||
    "";

  const admobAndroidAppId =
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID?.trim() ||
    "ca-app-pub-3940256099942544~3347511713";
  const admobIosAppId =
    process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID?.trim() ||
    "ca-app-pub-3940256099942544~1458002511";

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      [
        "react-native-google-mobile-ads",
        {
          androidAppId: admobAndroidAppId,
          iosAppId: admobIosAppId,
        },
      ],
    ],
    android: {
      ...config.android,
      package: "madi.haj.app",
      ...(googleMapsApiKey
        ? {
            config: {
              googleMaps: {
                apiKey: googleMapsApiKey,
              },
            },
          }
        : {}),
    },
    extra: {
      ...config.extra,
      eas: {
        projectId: "a8562aba-6eab-4fce-9342-81554f90c0fc",
      },
    },
  };
};
