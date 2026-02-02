const fs = require('fs');

const writeEnvToFile = (envVar, fileName) => {
  const content = process.env.hasOwnProperty(envVar)
    ? process.env[envVar]
    : undefined;
  if (!content) return null;

  try {
    if (content.startsWith('./') || content.startsWith('/')) {
      // It's a path, just return it.
      return content;
    }
    fs.writeFileSync(fileName, content);
    return `./${fileName}`;
  } catch (error) {
    console.log(`Error writing ${fileName}:`, error);
    return null;
  }
};

export default ({ config }) => {
  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...(config.android?.config ?? {}),
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
      googleServicesFile:
        writeEnvToFile(
          'EXPO_PRIVATE_GOOGLE_SERVICES_JSON',
          'google-services.json'
        ) || './google-services.json',
    },
  };
};
