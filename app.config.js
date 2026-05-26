/** @type {import('expo/config').ExpoConfig} */
const appJson = require("./app.json");

const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
  process.env.GMAPS_API_KEY?.trim() ||
  "";

module.exports = {
  expo: {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
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
  },
};
