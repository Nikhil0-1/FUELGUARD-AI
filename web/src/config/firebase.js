import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDjFNRqEMZT1E7igssIx8g1I2hUG5G-Hdg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fuelguard-ai.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://fuelguard-ai-default-rtdb.firebaseio.com/",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fuelguard-ai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fuelguard-ai.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "843013232554",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:843013232554:web:374c2ce6f6ec816c48bdd3"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export default app;
