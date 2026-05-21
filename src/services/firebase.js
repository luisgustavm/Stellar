import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD0l5N3ljT8qawsKwdkEOtqF6aDsNjGMXo",
  authDomain: "stellar-steraction.firebaseapp.com",
  projectId: "stellar-steraction",
  messagingSenderId: "560490316039",
  appId: "1:560490316039:web:80e84d7f209f79482185a2",
  measurementId: "G-1N9J8ZBP19",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
