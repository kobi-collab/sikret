const appJson = require('./app.json');

module.exports = ({ config }) => ({
  ...appJson.expo,
  ...config,
  extra: {
    ...appJson.expo.extra,
    ...(config?.extra ?? {}),
    apiUrl: process.env.EXPO_PUBLIC_API_URL || null,
  },
});
