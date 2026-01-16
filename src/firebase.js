import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCpxO90qMksFctracaKd23uTSxUOszg0mA",
  authDomain: "q-hive-17116.firebaseapp.com",
  projectId: "q-hive-17116",
  storageBucket: "q-hive-17116.appspot.com",
  messagingSenderId: "70781620264",
  appId: "1:70781620264:web:4d88565413fcb521f6651d"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);

// ✅ Firestore with offline persistence (NEW WAY)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager()
  })
});

// Storage
export const storage = getStorage(app);
