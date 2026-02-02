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
    console.error(`Error writing ${fileName}:`, error);
    return null;
  }
};

export default ({ config }) => {
  return {
    ...config,
    android: {
      ...config.android,
      googleServicesFile:
        writeEnvToFile(
          'EXPO_PRIVATE_GOOGLE_SERVICES_JSON',
          'google-services.json'
        ) || './google-services.json',
    },
    ios: {
      ...config.ios,
      googleServicesFile:
        writeEnvToFile(
          'EXPO_PRIVATE_GOOGLE_SERVICES_PLIST',
          'GoogleService-Info.plist'
        ) || './GoogleService-Info.plist',
    },
  };
};
