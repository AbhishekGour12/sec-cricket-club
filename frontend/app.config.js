const appJson = require('./app.json');

const PRODUCTION_API_URL = 'https://sec-api.duckdns.org/api';
const DEPRECATED_RENDER_HOST = 'sec-cricket-club.onrender.com';

const resolveBuildApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl && !envUrl.includes(DEPRECATED_RENDER_HOST)) {
    return envUrl;
  }
  return PRODUCTION_API_URL;
};

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    apiUrl: resolveBuildApiUrl(),
    appEnv: process.env.EXPO_PUBLIC_APP_ENV || 'production',
  },
};
