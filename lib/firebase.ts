import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';

// Optionally import the services that you want to use
// import {...} from 'firebase/auth';
// import {...} from 'firebase/database';
// import {...} from 'firebase/firestore';
// import {...} from 'firebase/functions';
// import {...} from 'firebase/storage';

const apiKey = process.env.EXPO_PRIVATE_API_KEY;
const authDomain = process.env.EXPO_PRIVATE_AUTH_DOMAIN;
const projectId = process.env.EXPO_PRIVATE_PROJECT_ID;
const storageBucket = process.env.EXPO_PRIVATE_STORAGE_BUCKET;
const messagingSenderId = process.env.EXPO_PRIVATE_MESSENGER_SENDER_ID;
const appId = process.env.EXPO_PRIVATE_APP_ID;
const measurementId = process.env.EXPO_PRIVATE_MEASUREMENT_ID;

// Initialize Firebase
export const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
  measurementId: measurementId,
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
// For more information on how to access Firebase in your project,
// see the Firebase documentation: https://firebase.google.com/docs/web/setup#access-firebase
