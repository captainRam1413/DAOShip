import { initializeApp } from 'firebase/app';
import { getAuth, GithubAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "[REDACTED - Use your own Firebase API key]",
  authDomain: "daoship-24d97.firebaseapp.com",
  projectId: "daoship-24d97",
  storageBucket: "daoship-24d97.firebasestorage.app",
  messagingSenderId: "753856620386",
  appId: "1:753856620386:web:67f25be4247eb92f296e3b",
  measurementId: "G-G8RS5C98KN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const githubProvider = new GithubAuthProvider();

// Request additional GitHub scopes (optional)
githubProvider.addScope('repo');
githubProvider.addScope('user:email');

// Simplified Firebase setup without complex offline persistence
// that was causing connectivity issues
console.log('Firebase initialized successfully');

export const isOnline = navigator.onLine;