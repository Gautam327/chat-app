import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "chatapp-3710b.firebaseapp.com",
  projectId: "chatapp-3710b",
  storageBucket: "chatapp-3710b.appspot.com",
  messagingSenderId: "1076822664624",
  appId: "1:1076822664624:web:4847d162212571ff4c6275"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()