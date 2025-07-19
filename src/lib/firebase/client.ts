// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";

// Your web app's Firebase configuration is sensitive and should not be hardcoded.
// It is fetched from environment variables.

let app: FirebaseApp;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Basic validation to ensure environment variables are loaded.
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Firebase config is missing. Make sure .env variables are set and prefixed with NEXT_PUBLIC_");
}

// Initialize Firebase
if (getApps().length) {
  app = getApp();
} else {
  app = initializeApp(firebaseConfig);
}


export { app };
