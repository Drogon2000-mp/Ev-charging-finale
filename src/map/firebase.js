// src/firebase.js

// Import Firebase services
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// Your Firebase config (from App.docx)
const firebaseConfig = {
  apiKey: "AIzaSyCEEZzFEspXrPGgs_YAUfZ1VtGm6l5aMcI",
  authDomain: "location-app-1-2af30.firebaseapp.com",
  projectId: "location-app-1-2af30",
  storageBucket: "location-app-1-2af30.appspot.com",
  messagingSenderId: "899638554384",
  appId: "1:899638554384:web:71e23e8d5a06a09a05ff95"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Export Firestore and Auth
const database = getFirestore(app);
const auth = getAuth(app);

export { database, auth, signInAnonymously };
