import { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  linkWithPopup,
  getAdditionalUserInfo,
  GithubAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, githubProvider, db } from './firebase.js';

export const useGitHubAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setError(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const connectGitHub = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;
      const additionalInfo = getAdditionalUserInfo(result);

      // Get GitHub access token
      const credential = GithubAuthProvider.credentialFromResult(result);
      const accessToken = credential.accessToken;

      // Extract GitHub username from provider data
      const githubUsername = user.providerData[0]?.displayName ||
                           additionalInfo?.username ||
                           user.reloadUserInfo?.screenName;

      // Store user data in Firestore with retry logic
      const userDoc = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        githubUsername: githubUsername,
        githubAccessToken: accessToken,
        githubProfile: additionalInfo.profile,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      await setDocWithRetry(doc(db, 'users', user.uid), userDoc, { merge: true });

      console.log('GitHub connected successfully:', user);
      return { success: true, user };
    } catch (error) {
      console.error('GitHub connection error:', error);
      setError(error.message);

      // Handle specific errors
      if (error.code === 'auth/account-exists-with-different-credential') {
        setError('Account exists with different credential. Please use your original sign-in method.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setError('Sign-in cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Popup blocked. Please allow popups for this site.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection and try again.');
      } else if (error.code === 'firestore/unavailable') {
        setError('Database temporarily unavailable. Please try again in a moment.');
      }

      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const disconnectGitHub = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      console.log('GitHub disconnected successfully');
      return { success: true };
    } catch (error) {
      console.error('GitHub disconnection error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getUserData = async (uid) => {
    try {
      const userDoc = await getDocWithRetry(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  return {
    user,
    loading,
    error,
    connectGitHub,
    disconnectGitHub,
    getUserData,
    isConnected: !!user
  };
};

// Helper function to retry Firestore operations
const setDocWithRetry = async (docRef, data, options, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await setDoc(docRef, data, options);
      return;
    } catch (error) {
      console.log(`Firestore write attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        throw error; // Last attempt failed, throw the error
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};

const getDocWithRetry = async (docRef, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await getDoc(docRef);
    } catch (error) {
      console.log(`Firestore read attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
