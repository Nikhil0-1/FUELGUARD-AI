import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForViteBuildSuccess001",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fuelguard-dummy-auth.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://fuelguard-dummy-db.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fuelguard-dummy-proj",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fuelguard-dummy.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcd1234efgh"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export default app;
