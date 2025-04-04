import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWwvYQHESDFoj0oC4YiCwufYy4zU-LqlM",
  authDomain: "tassenger-689e4.firebaseapp.com",
  projectId: "tassenger-689e4",
  storageBucket: "tassenger-689e4.appspot.com",
  messagingSenderId: "634757009406",
  appId: "1:634757009406:web:8054573c12dde8c4af7aaf",
  measurementId: "G-FJZQWK8BQY",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
