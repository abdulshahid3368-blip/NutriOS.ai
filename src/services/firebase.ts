import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, Firestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy, deleteDoc, updateDoc } from 'firebase/firestore';

// Safely retrieve environment variables
const metaEnv = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: metaEnv.VITE_FIREBASE_APP_ID,
};

const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.authDomain
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('[NutriOS Firebase] Real Firebase client successfully initialized.');
  } catch (error) {
    console.error('[NutriOS Firebase] Error initializing real Firebase:', error);
  }
} else {
  console.warn('[NutriOS Firebase] Firebase configuration is missing. Falling back to robust simulated engine.');
}

export { app, auth, db, isFirebaseConfigured };

// Robust fallback user system and db handlers
export interface MockUser {
  uid: string;
  email: string;
  displayName?: string;
}

export async function syncUserProfile(uid: string, profile: any) {
  if (db) {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, profile, { merge: true });
    } catch (e) {
      console.error('[Firebase syncUserProfile error]', e);
    }
  }
}

export async function fetchUserProfile(uid: string): Promise<any | null> {
  if (db) {
    try {
      const userRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
    } catch (e) {
      console.error('[Firebase fetchUserProfile error]', e);
    }
  }
  return null;
}
