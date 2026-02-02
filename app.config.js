import 'dotenv/config';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';

const writeEnvToFile = (envVar, fileName) => {
  const content = process.env.hasOwnProperty(envVar)
    ? process.env[envVar]
    : undefined;
  if (!content) return null;

  try {
    const targetPath = resolve(dirname(require.main.filename), fileName);
    writeFileSync(targetPath, content);
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
    extra: {
      ...config.extra,
      firebaseAdminSdkFile:
        writeEnvToFile(
          'EXPO_PRIVATE_FIREBASE_ADMINSDK_JSON',
          'guard-imoto-project-firebase-adminsdk-fbsvc-e7c194adc6.json'
        ) || './guard-imoto-project-firebase-adminsdk-fbsvc-e7c194adc6.json',
    },
  };
};
