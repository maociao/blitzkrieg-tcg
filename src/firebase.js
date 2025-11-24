import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration is loaded from environment variables
// Expecting a JSON string for VITE_FIREBASE_CONFIG for backward compatibility with the original script style,
// or individual fields if we prefer. For now, let's assume the user will provide the config object.
// But standard Vite usage is VITE_FIREBASE_API_KEY etc.
// Let's support the JSON method as it's what the original code expected (__firebase_config).

let firebaseConfig;
try {
  firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);
} catch (e) {
  console.warn("VITE_FIREBASE_CONFIG not found or invalid. Please check your .env file.");
  firebaseConfig = {};
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const appId = import.meta.env.VITE_APP_ID || 'blitzkrieg-tcg';
