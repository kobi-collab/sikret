const appJson = require('./app.json');

/** Production API — used when EXPO_PUBLIC_API_URL is missing from the EAS build env. */
const PRODUCTION_API_URL = 'https://sikret-api.onrender.com';

module.exports = ({ config }) => ({
  ...appJson.expo,
  ...config,
  extra: {
    ...appJson.expo.extra,
    ...(config?.extra ?? {}),
    apiUrl: process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL,
  },
});
