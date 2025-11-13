import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Debug: Check if environment variables are loaded
console.log("🔥 Firebase Config Check:");
console.log("API Key exists:", !!firebaseConfig.apiKey);
console.log("Auth Domain:", firebaseConfig.authDomain);
console.log("Project ID:", firebaseConfig.projectId);

// Verify all required fields are present
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
  console.error("❌ Missing Firebase config fields:", missingFields);
  console.error("⚠️ Make sure to:");
  console.error("  1. Stop the dev server (Ctrl+C)");
  console.error("  2. Restart with: npm run dev");
  console.error("  3. Hard refresh browser (Ctrl+Shift+R)");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Realtime Database (Primary Database)
let db = null;
try {
  db = getDatabase(app);
  console.log("✅ Realtime Database initialized successfully");
} catch (error) {
  console.warn("⚠️ Realtime Database initialization failed:", error.message);
  console.log("Authentication will still work without database");
}

// Initialize Firestore (Optional - for future migration)
let firestore = null;
try {
  firestore = getFirestore(app);
  console.log("✅ Firestore initialized successfully");
} catch (error) {
  console.warn("⚠️ Firestore initialization failed:", error.message);
}

// Initialize Cloud Functions
const functions = getFunctions(app);

const analytics = getAnalytics(app);

export { app, auth, db, firestore, functions, analytics };