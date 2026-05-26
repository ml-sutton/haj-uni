/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  const googleMapsApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.GMAPS_API_KEY?.trim() ||
    "";

  return {
    ...config,
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
