import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

let auth: any;
let googleProvider: any;

if (typeof window === 'undefined') {
  auth = null;
  googleProvider = null;
} else {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!firebaseConfig.apiKey) {
    console.warn("[FORZA] Firebase env variables are missing.");
    auth = null;
    googleProvider = null;
  } else {
    try {
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      auth = getAuth(app);
      googleProvider = new GoogleAuthProvider();
    } catch (err) {
      console.error("[FORZA] Firebase initialization failed:", err);
      auth = null;
      googleProvider = null;
    }
  }
}

export { auth, googleProvider };