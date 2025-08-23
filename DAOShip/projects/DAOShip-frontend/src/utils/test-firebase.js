// Test Firebase connectivity
import { auth, db } from '../hooks/firebase.js';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export const testFirebaseConnectivity = async () => {
  console.log('🔥 Testing Firebase connectivity...');
  
  try {
    // Test 1: Check if Firebase is initialized
    console.log('1. Firebase config:', {
      projectId: auth.app.options.projectId,
      authDomain: auth.app.options.authDomain,
      storageBucket: auth.app.options.storageBucket
    });

    // Test 2: Check auth state
    console.log('2. Current auth state:', auth.currentUser);

    // Test 3: Test Firestore connectivity with a simple write/read
    const testDocRef = doc(db, 'test', 'connectivity-test');
    const testData = {
      timestamp: new Date(),
      message: 'Firebase connectivity test',
      userAgent: navigator.userAgent
    };

    console.log('3. Testing Firestore write...');
    await setDoc(testDocRef, testData);
    console.log('✅ Firestore write successful');

    console.log('4. Testing Firestore read...');
    const docSnap = await getDoc(testDocRef);
    if (docSnap.exists()) {
      console.log('✅ Firestore read successful:', docSnap.data());
    } else {
      console.log('❌ Document does not exist');
    }

    // Test 4: Test collection write
    console.log('5. Testing collection write...');
    const testCollectionRef = collection(db, 'test-collection');
    await addDoc(testCollectionRef, {
      created: new Date(),
      test: 'collection write test'
    });
    console.log('✅ Collection write successful');

    return { success: true, message: 'All Firebase tests passed!' };

  } catch (error) {
    console.error('❌ Firebase connectivity test failed:', error);
    
    // Detailed error analysis
    if (error.code === 'auth/network-request-failed') {
      console.log('Network error: Check your internet connection');
    } else if (error.code === 'firestore/unavailable') {
      console.log('Firestore is temporarily unavailable');
    } else if (error.code === 'permission-denied') {
      console.log('Permission denied: Check Firebase security rules');
    }

    return { 
      success: false, 
      error: error.message, 
      code: error.code,
      details: error
    };
  }
};

export const checkNetworkConnectivity = async () => {
  console.log('🌐 Testing network connectivity...');
  
  try {
    // Test basic internet connectivity
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors'
    });
    console.log('✅ Internet connectivity: OK');

    // Test Firebase services
    const firebaseResponse = await fetch('https://firebase.googleapis.com/', {
      method: 'HEAD',
      mode: 'no-cors'
    });
    console.log('✅ Firebase services reachable');

    return { success: true, message: 'Network connectivity is good' };
  } catch (error) {
    console.error('❌ Network connectivity failed:', error);
    return { success: false, error: error.message };
  }
};

export const testAuthFlow = () => {
  console.log('🔐 Testing Firebase Auth state changes...');
  
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ User is signed in:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          providerData: user.providerData
        });
      } else {
        console.log('ℹ️ User is signed out');
      }
      
      unsubscribe(); // Stop listening after first check
      resolve({ user: user ? user.uid : null });
    });
  });
};
