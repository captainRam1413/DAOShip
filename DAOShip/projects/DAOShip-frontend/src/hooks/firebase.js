import { initializeApp } from 'firebase/app';
import { getAuth, GithubAuthProvider } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, enableNetwork } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBJTzY3DjZrz5ay0rDUA1Uh2Go2l8teBPg",
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

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Firebase persistence failed: Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code == 'unimplemented') {
    console.warn('Firebase persistence failed: The current browser does not support all of the features required to enable persistence');
  } else {
    console.warn('Firebase persistence failed:', err);
  }
});

// Listen for online/offline status
let isOnline = navigator.onLine;

const handleOnline = () => {
  console.log('Network connection restored, enabling Firestore');
  isOnline = true;
  enableNetwork(db).catch(console.error);
};

const handleOffline = () => {
  console.log('Network connection lost, Firestore will work in offline mode');
  isOnline = false;
};

window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);

export { isOnline };