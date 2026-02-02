import { Buffer } from 'buffer';
import 'dotenv/config';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const writeEnvToFile = (envVar, fileName) => {
  const rawValue = process.env.hasOwnProperty(envVar)
    ? process.env[envVar]
    : undefined;
  if (!rawValue) return null;

  try {
    let content = rawValue;
    if (content.startsWith('base64:')) {
      content = Buffer.from(content.slice('base64:'.length), 'base64').toString(
        'utf8'
      );
    } else if (
      (content.startsWith('"') && content.endsWith('"')) ||
      (content.startsWith("'") && content.endsWith("'"))
    ) {
      // Unwrap quoted JSON string without converting \\n to newlines.
      content = content.slice(1, -1);
      content = content.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }

    const baseDir = process.cwd();
    const targetPath = resolve(baseDir, fileName);

    const envPath = content.startsWith('/')
      ? content
      : content.startsWith('./') || content.startsWith('../')
        ? resolve(baseDir, content)
        : null;

    if (envPath && existsSync(envPath)) {
      const fileContent = readFileSync(envPath, 'utf8');
      writeFileSync(targetPath, fileContent);
    } else {
      writeFileSync(targetPath, content);
    }

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
